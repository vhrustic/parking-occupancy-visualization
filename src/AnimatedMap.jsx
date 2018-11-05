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

import { MAP_CENTER, DEFAULT_VIEW } from './constants';

import carIcon from './images/car1.png';

import 'ol/ol.css';

class AnimatedMap extends Component {
  constructor(props) {
    super(props);

    this.center = fromLonLat([MAP_CENTER.LAT, MAP_CENTER.LONG]);
    const rasterLayer = new TileLayer({
      source: new OSM()
    });
    const vectorLayer = this.getVectorLayerWithIcon();

    this.map = new Map({
      target: 'map',
      layers: [rasterLayer, vectorLayer],
      view: new View({
        center: this.center,
        zoom: DEFAULT_VIEW.ZOOM,
        rotation: DEFAULT_VIEW.ROTATION
      })
    });
  }

  getVectorLayerWithIcon = () => {
    const iconFeature = new Feature({
      geometry: new Point(transform([MAP_CENTER.LAT, MAP_CENTER.LONG], 'EPSG:4326', 'EPSG:3857')),
      name: 'The icon',
      population: 4000,
      rainfall: 500
    });

    const carImage = new Image();
    carImage.src = carIcon;

    const iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        img: carImage,
        imgSize: [512, 512],
        scale: 0.1
      })
    });

    iconFeature.setStyle(iconStyle);

    const vectorSource = new Vector({
      features: [iconFeature]
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    return vectorLayer;
  };

  render() {
    return null;
  }
}

export default AnimatedMap;
