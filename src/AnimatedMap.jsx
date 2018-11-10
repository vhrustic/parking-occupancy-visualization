import React, { Component } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, transform } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { OSM, Vector } from 'ol/source';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';

import {
  MAP_CENTER,
  DEFAULT_VIEW,
  SECOND_COLUMN,
  THIRD_COLUMN,
  FOURTH_COLUMN,
  FIRST_COLUMN,
  DEFAULT_ANIMATION_SPEED,
  NUMBER_OF_FRAMES
} from './constants';

import carIcon from './images/car3_green.png';

import 'ol/ol.css';

class AnimatedMap extends Component {
  constructor(props) {
    super(props);

    //animation related properties
    this.history = [];
    this.state = { isAnimationRunning: false, animationSpeed: 1, currentFrame: 0 };

    this.id = 0;
    this.carImage = new Image();
    this.carImage.src = carIcon;

    this.center = fromLonLat([MAP_CENTER.LAT, MAP_CENTER.LONG]);
  }

  componentDidMount() {
    const rasterLayer = new TileLayer({
      source: new OSM()
    });
    this.setVectorLayer();

    this.map = new Map({
      target: 'map',
      layers: [rasterLayer, this.vectorLayer],
      view: new View({
        center: this.center,
        zoom: DEFAULT_VIEW.ZOOM,
        rotation: DEFAULT_VIEW.ROTATION
      }),
      controls: defaultControls({
        attributionOptions: {
          collapsible: false
        }
      })
    });

    this.generateAnimationHistory();

    this.startAnimation();
  }

  generateAnimationHistory = () => {
    for (let i = 0; i < NUMBER_OF_FRAMES - 1; ++i) {
      const oldState = this.history[i];
      const newState = this.getNextState(oldState);
      this.saveStateInHistory(newState);
    }
  };

  startAnimation = () => {
    setTimeout(this.timeoutCallback, 0);
  };

  timeoutCallback = () => {
    if (!this.state.isAnimationRunning) {
      return;
    }

    this.setState(
      prevState => ({ currentFrame: prevState.currentFrame + 1 }),
      () => {
        if (this.state.currentFrame === this.history.length) {
          return this.setState({ isAnimationRunning: false });
        }
        if (this.state.currentFrame === this.history.length) {
          return this.setState({ isAnimationRunning: false });
        }

        const nextState = this.history[this.state.currentFrame];
        const features = this.getStateFeatures(nextState);
        this.updateVectorFeatures(features);
      }
    );

    setTimeout(this.timeoutCallback, DEFAULT_ANIMATION_SPEED / this.state.animationSpeed);
  };

  randomizeCarVisibility = state => {
    state.forEach(column => {
      column.forEach(point => {
        const randomBoolean = Math.random() >= 0.3;
        point.show = randomBoolean;
      });
    });
  };

  saveStateInHistory = state => {
    this.history.push(state);
  };

  getNextState = state => {
    const newState = this.getStateDeepCopy(state);
    this.randomizeCarVisibility(newState);

    return newState;
  };

  getStateDeepCopy = state => {
    return state.map(column => this.getColumnDeepCopy(column));
  };

  getColumnDeepCopy = column => {
    return column.map(point => [...point]);
  };

  updateVectorFeatures = features => {
    this.vectorSource.clear();
    features.forEach(feature => this.vectorSource.addFeature(feature));
  };

  getFeatureWithCar = point => {
    const iconFeature = new Feature({
      geometry: new Point(transform([point[0], point[1]], 'EPSG:4326', 'EPSG:3857'))
    });

    const iconStyle = new Style({
      image: new Icon({
        img: this.carImage,
        imgSize: [511, 290],
        scale: 0.13
      })
    });

    iconFeature.setStyle(iconStyle);
    iconFeature.setId(this.id++);

    return iconFeature;
  };

  getColumnFeatures = column => {
    let features = [];
    for (let i = 0; i < column.length; ++i) {
      const point = column[i];
      if (point.show) {
        const iconFeature = this.getFeatureWithCar(point);
        features.push(iconFeature);
      }
    }
    return features;
  };

  getStateFeatures = state => {
    let features = [];
    state.forEach(column => {
      const columnFeatures = this.getColumnFeatures(column);
      features = features.concat(columnFeatures);
    });
    return features;
  };

  setVectorLayer = () => {
    const initialState = [FIRST_COLUMN, SECOND_COLUMN, THIRD_COLUMN, FOURTH_COLUMN];
    this.randomizeCarVisibility(initialState);
    this.saveStateInHistory(initialState);
    let features = [];
    initialState.forEach(column => {
      column.forEach(point => {
        if (point.show) {
          const iconFeature = this.getFeatureWithCar(point);

          features.push(iconFeature);
        }
      });
    });

    this.vectorSource = new Vector({
      features
    });

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });
  };

  playAnimation = () => {
    this.setState({ isAnimationRunning: true }, this.startAnimation);
  };

  pauseAnimation = () => {
    this.setState({ isAnimationRunning: false });
  };

  stopAnimation = isReplay => {
    this.pauseAnimation();
    this.setState({ currentFrame: 0 });
    if (isReplay) {
      this.setState({ isAnimationRunning: true }, () => {
        this.startAnimation();
      });
    }
  };

  changeAnimationSpeed = () => {
    const { animationSpeed } = this.state;
    const newSpeed = animationSpeed + 1 > 3 ? 1 : animationSpeed + 1;

    this.setState({ animationSpeed: newSpeed });
  };

  handleSilderChange = event => {
    console.log(event);
    console.log('promjena');
  };

  render() {
    const { isAnimationRunning, animationSpeed } = this.state;
    console.log(this.state);
    return (
      <>
        <div className="animation-actions">
          <button
            onClick={this.playAnimation}
            disabled={isAnimationRunning || this.state.currentFrame === this.history.length}
          >
            Play
          </button>
          <button onClick={this.pauseAnimation} disabled={!isAnimationRunning}>
            Pause
          </button>
          <button
            onClick={() => this.stopAnimation(this.state.currentFrame >= this.history.length)}
            disabled={!isAnimationRunning && this.state.currentFrame < this.history.length}
          >
            {this.state.currentFrame < this.history.length ? 'Stop' : 'Replay'}
          </button>
          <button onClick={this.changeAnimationSpeed}>{`${animationSpeed}x`}</button>
          <span className="frame-counter">
            Frame: {`${this.state.currentFrame}/${this.history.length}`}
          </span>
        </div>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max={NUMBER_OF_FRAMES}
            value={this.state.currentFrame}
            onChange={this.handleSilderChange}
            className="slider"
            id="myRange"
          />
        </div>
      </>
    );
  }
}

export default AnimatedMap;
