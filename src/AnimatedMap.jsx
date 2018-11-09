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
  FIRST_COLUMN
} from './constants';

import carIcon from './images/car3_green.png';

import 'ol/ol.css';

class AnimatedMap extends Component {
  constructor(props) {
    super(props);

    this.history = [];
    this.carImage = new Image();
    this.carImage.src = carIcon;

    this.center = fromLonLat([MAP_CENTER.LAT, MAP_CENTER.LONG]);
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

    this.startAnimation();
  }

  startAnimation = () => {
    const state = [FIRST_COLUMN, SECOND_COLUMN, THIRD_COLUMN, FOURTH_COLUMN];
    const initialState = this.getNextState(state);

    this.saveStateInHistory(initialState);

    setTimeout(this.intervalCallback, 2000);
  };

  intervalCallback = () => {
    const nextState = this.getNextState(this.history[this.history.length - 1]);
    const features = this.getStateFeatures(nextState);
    this.updateVectorFeatures(features);
    this.saveStateInHistory(nextState);
  };

  randomizeCarVisibility = state => {
    state.forEach(column => {
      column.forEach(point => {
        const randomBoolean = Math.random() >= 0.5;
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
    try {
      features.forEach((feature, i) => {
        console.log(i, ' ok');
        this.vectorSource.addFeature(feature);
      });
    } catch (e) {
      console.log(e);
    }
    console.log(this.vectorSource.getFeatures());
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
    console.log('ICON FEATURE', iconFeature);
    return iconFeature;
  };

  getColumnFeatures = column => {
    let features = [];
    console.log('kolona ', column);
    for (let i = 0; i < column.length; ++i) {
      const point = column[i];
      if (point.show) {
        const iconFeature = this.getFeatureWithCar(point);
        features.push(iconFeature);
      }
    }
    console.log('COLUMN FEATURES', features);
    return features;
  };

  getStateFeatures = state => {
    let features = [];
    state.forEach(column => {
      const columnFeatures = this.getColumnFeatures(column);
      features = columnFeatures.concat(columnFeatures);
    });
    console.log('STATE FEATURES', features);
    return features;
  };

  setVectorLayer = () => {
    let features = [];
    for (let i = 0; i < FIRST_COLUMN.length; ++i) {
      const point = FIRST_COLUMN[i];
      const iconFeature = this.getFeatureWithCar(point);

      features.push(iconFeature);
    }

    this.vectorSource = new Vector({
      features
    });

    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });
  };

  render() {
    return null;
  }
}

export default AnimatedMap;
