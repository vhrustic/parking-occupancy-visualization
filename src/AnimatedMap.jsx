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

import carPickup from './images/car_pickup.png';
import redCar from './images/car_red.png';
import greenCar from './images/car_green.png';
import carOrange from './images/car_orange.png';
import yellowCar from './images/car_yellow.png';

import 'ol/ol.css';

class AnimatedMap extends Component {
  constructor(props) {
    super(props);

    //animation related properties
    this.history = [];
    this.state = { isAnimationRunning: false, animationSpeed: 1, currentFrame: 0 };
    this.carImages = this.getCarIcons();
    this.id = 0;

    this.center = fromLonLat([MAP_CENTER.LAT, MAP_CENTER.LONG]);
  }

  getCarIcons() {
    const carImages = [carPickup, redCar, greenCar, carOrange, yellowCar];
    const carImagesObjects = [];
    carImages.forEach(carImage => {
      const image = new Image();
      image.src = carImage;
      carImagesObjects.push(image);
    });
    return carImagesObjects;
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
  }

  generateAnimationHistory = () => {
    const initialState = [FIRST_COLUMN, SECOND_COLUMN, THIRD_COLUMN, FOURTH_COLUMN];

    this.randomizeCarVisibility(initialState);
    this.saveStateInHistory(initialState);

    for (let i = 0; i < NUMBER_OF_FRAMES - 1; ++i) {
      const oldState = this.history[i];
      const newState = this.getNextState(oldState);
      this.saveStateInHistory(newState);
    }
    this.forceUpdate();
  };

  startAnimation = () => {
    this.timeout = setTimeout(this.zeroTimeoutCallback, 0);
  };

  zeroTimeoutCallback = () => {
    const nextState = this.history[this.state.currentFrame];
    const features = this.getStateFeatures(nextState);
    this.updateVectorFeatures(features);

    this.timeout = setTimeout(
      this.timeoutCallback,
      DEFAULT_ANIMATION_SPEED / this.state.animationSpeed
    );
  };

  timeoutCallback = () => {
    if (!this.state.isAnimationRunning) {
      return;
    }
    this.setState(
      prevState => ({ currentFrame: prevState.currentFrame + 1 }),
      () => {
        if (this.state.currentFrame === this.history.length - 1) {
          this.setState({ isAnimationRunning: false });
        } else if (this.state.currentFrame > this.history.length - 1) {
          return;
        }

        const nextState = this.history[this.state.currentFrame];
        const features = this.getStateFeatures(nextState);
        this.updateVectorFeatures(features);

        this.timeout = setTimeout(
          this.timeoutCallback,
          DEFAULT_ANIMATION_SPEED / this.state.animationSpeed
        );
      }
    );
  };

  randomizeCarVisibility = state => {
    state.forEach(column => {
      column.forEach(point => {
        let randomBoolean = null;
        const currentHour = this.history.length;
        switch (true) {
          case currentHour < 0.18 * NUMBER_OF_FRAMES:
            randomBoolean = Math.random() >= 0.75;
            break;
          case currentHour < 0.25 * NUMBER_OF_FRAMES:
            randomBoolean = Math.random() >= 0.55;
            break;
          case currentHour < 0.6 * NUMBER_OF_FRAMES:
            randomBoolean = Math.random() >= 0.1;
            break;
          case currentHour < 0.75 * NUMBER_OF_FRAMES:
            randomBoolean = Math.random() >= 0.2;
            break;
          default:
            randomBoolean = Math.random() >= 0.85;
        }
        point.show = randomBoolean;
        if (point.show) {
          point.rotation = [0, Math.PI][Math.floor(Math.random() * 2)];
          point.imageIndex = Math.floor(Math.random() * this.carImages.length);
        }
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
        img: this.carImages[point.imageIndex],
        imgSize: [511, 200],
        scale: 0.175,
        rotation: point.rotation
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
    this.vectorSource = new Vector({
      features: []
    });

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });
  };

  playAnimation = () => {
    this.setState({ isAnimationRunning: true }, this.startAnimation);
  };

  pauseAnimation = () => {
    clearTimeout(this.timeout);
    this.setState({ isAnimationRunning: false });
  };

  stopAnimation = isReplay => {
    clearTimeout(this.timeout);
    if (isReplay) {
      return this.setState({ isAnimationRunning: true, currentFrame: 0 }, () => {
        this.startAnimation();
      });
    }
    this.setState({ currentFrame: 0 });
    this.vectorSource.clear();
    this.pauseAnimation();
  };

  changeAnimationSpeed = () => {
    const { animationSpeed } = this.state;
    const newSpeed = animationSpeed + 1 > 3 ? 1 : animationSpeed + 1;

    this.setState({ animationSpeed: newSpeed });
  };

  handleSliderChange = event => {
    const value = parseInt(event.target.value, 10);
    this.setState({ currentFrame: value }, () => {
      if (this.state.isAnimationRunning) {
        if (value === this.history.length - 1) {
          this.setState({ isAnimationRunning: false });
          clearTimeout(this.timeout);
        } else {
          clearTimeout(this.timeout);
          this.timeout = setTimeout(
            this.timeoutCallback,
            DEFAULT_ANIMATION_SPEED / this.state.animationSpeed
          );
        }
      }
      const nextState = this.history[this.state.currentFrame];
      const features = this.getStateFeatures(nextState);
      this.updateVectorFeatures(features);
    });
  };

  getFrameDisplay = () => {
    const { currentFrame } = this.state;
    const frame = currentFrame > this.history.length ? this.history.length : currentFrame + 1;

    return <span className="frame-counter">Frame: {`${frame} / ${this.history.length}`}</span>;
  };

  render() {
    const { isAnimationRunning, animationSpeed, currentFrame } = this.state;
    const frameDisplay = this.getFrameDisplay();
    return (
      <>
        <div className="animation-actions">
          <button
            onClick={this.playAnimation}
            disabled={isAnimationRunning || currentFrame >= this.history.length - 1}
          >
            Play
          </button>
          <button onClick={this.pauseAnimation} disabled={!isAnimationRunning}>
            Pause
          </button>
          <button
            onClick={() => this.stopAnimation(currentFrame >= this.history.length - 1)}
            disabled={!isAnimationRunning && currentFrame < this.history.length - 1}
          >
            {currentFrame < this.history.length - 1 ? 'Stop' : 'Replay'}
          </button>
          <button onClick={this.changeAnimationSpeed}>{`${animationSpeed}x`}</button>
          {frameDisplay}
        </div>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max={NUMBER_OF_FRAMES - 1}
            value={currentFrame}
            onChange={this.handleSliderChange}
            className="slider"
            id="myRange"
          />
        </div>
      </>
    );
  }
}

export default AnimatedMap;
