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
  ZERO_CAR_POSITION,
  SECOND_COLUMN,
  THIRD_COLUMN,
  FOURTH_COLUMN
} from './constants';

import carIcon from './images/car3_green.png';

import 'ol/ol.css';

class AnimatedMap extends Component {
  constructor(props) {
    super(props);

    this.carImage = new Image();
    this.carImage.src = carIcon;

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
      }),
      controls: defaultControls({
        attributionOptions: {
          collapsible: false
        }
      })
    });
  }

  getVectorLayerWithIcon = () => {
    let features = [];
    for (let i = 0; i < THIRD_COLUMN.length; ++i) {
      const lat = FOURTH_COLUMN[i][0];
      const long = FOURTH_COLUMN[i][1];
      console.log(lat, long);
      const iconFeature = new Feature({
        geometry: new Point(transform([lat, long], 'EPSG:4326', 'EPSG:3857'))
      });

      const iconStyle = new Style({
        image: new Icon({
          img: this.carImage,
          imgSize: [511, 290],
          scale: 0.13
        })
      });

      iconFeature.setStyle(iconStyle);

      features.push(iconFeature);
    }
    console.log(features);
    const vectorSource = new Vector({
      features
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    return vectorLayer;
  };

  /*  getVectorLayerWithIcon = () => {
    let features = [];
    for (let i = 0; i < 8; ++i) {
      const lat = ZERO_CAR_POSITION.LAT + i * 0.000006 + 0.00025;
      const long = ZERO_CAR_POSITION.LONG - i * 0.000058 + 0.00001;
      console.log(lat, long);
      const iconFeature = new Feature({
        geometry: new Point(transform([lat, long], 'EPSG:4326', 'EPSG:3857'))
      });

      const iconStyle = new Style({
        image: new Icon({
          img: this.carImage,
          imgSize: [511, 290],
          scale: 0.13
        })
      });

      iconFeature.setStyle(iconStyle);

      features.push(iconFeature);
    }
    console.log(features);
    const vectorSource = new Vector({
      features
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    return vectorLayer;
  }; */

  render() {
    return null;
  }
}

export default AnimatedMap;
