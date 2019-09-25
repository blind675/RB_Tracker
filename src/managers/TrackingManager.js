import { accelerometer } from 'react-native-sensors';
import firebase from 'react-native-firebase';
import DeviceInfo from 'react-native-device-info';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';

import { updateStats } from '../actions/StatsActions';

export type GeoPoint = {
	longitude: number,
	latitude: number,
	accuracy: number,
	heading: number,
	altitude: number,
	altitudeAccuracy: number,
};

class TrackingManager {
	static instance = null;

	/**
     * @returns {TrackingManager}
     */
	static getInstance() {
		if (TrackingManager.instance == null) {
			TrackingManager.instance = new TrackingManager();

			BackgroundGeolocation.configure({
				desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
				stationaryRadius: 50,
				distanceFilter: 50,
				notificationsEnabled: false,
				debug: false,
				locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
				interval: 20000,
				fastestInterval: 5000,
				activitiesInterval: 10000,
				stopOnStillActivity: false,
			});
		}

		BackgroundGeolocation.on('location', location => {
			//TODO: maybe move sending data to server to backgroundTask???

			// handle your locations here
			// to perform long running operation on iOS
			// you need to create background task
			// BackgroundGeolocation.startTask(taskKey => {
			// 	// execute long running task
			// 	// eg. ajax post location
			// 	// IMPORTANT: task has to be ended by endTask
			// 	BackgroundGeolocation.endTask(taskKey);
			// });

			// only send locations with accuracy less then 20
			if (location.longitude && location.latitude && location.accuracy < 21) {
				const geoPoint: GeoPoint = {
					longitude: location.longitude,
					latitude: location.latitude,
					altitude: location.altitude,
					accuracy: location.accuracy,
					accelerometerData: this.instance._accelerometerData,
					uniqueId: DeviceInfo.getUniqueID(),
					manufacturer: DeviceInfo.getManufacturer(),
				};

				// send data to firebase.. no need to call redux
				firebase.firestore().collection('geo_points').add(geoPoint);

				this.instance._accelerometerData = [];

				if (this.instance._lastGeoPoint) {
					//calculate distance of 2 points
					const durationInSeconds = Math.floor((Date.now() - this.instance._lastTimestamp) / 1000);
					const distance = this.instance._distanceToPointInM(geoPoint, this.instance._lastGeoPoint);

					updateStats(distance, durationInSeconds);
				}

				this.instance._lastGeoPoint = geoPoint;
				this.instance._lastTimestamp = Date.now();
			}
		});

		return this.instance;
	}

	constructor() {
		//internal flags
		this._accelerometerObserver = null;
		this._accelerometerData = [];

		// internal variables
		this._lastGeoPoint = null;
		this._lastTimestamp = null;

		return this;
	}

	addAccelerometer = accelerometerObject => {
		if (this._accelerometerData.length < 100) {
			this._accelerometerData.push(accelerometerObject);
		} else {
			this._accelerometerData.push(accelerometerObject);
			this._accelerometerData = this._accelerometerData.slice(
				this._accelerometerData.length - 100,
				this._accelerometerData.length
			);
		}
	};

	//TODO: if user si stationary show a local notification telling him to stop his app
	// https://github.com/wumke/react-native-local-notifications
	startTracking = () => {
		//start timestamp
		this._lastTimestamp = Date.now();

		// setUpdateIntervalForType(SensorTypes.accelerometer, 400);
		this._accelerometerObserver = accelerometer.subscribe(data => {
			// create new accelerometer object
			const accelerometerObject = {
				x: data.x,
				y: data.y,
				z: data.z,
			};

			this.addAccelerometer(accelerometerObject);
		});

		BackgroundGeolocation.start();
	};

	stopTracking = () => {
		if (this._accelerometerObserver) {
			this._accelerometerObserver.unsubscribe();
		}

		BackgroundGeolocation.stop();
		BackgroundGeolocation.removeAllListeners();

		//clear timestamp
		this._lastTimestamp = null;
		this._lastGeoPoint = null;
		this._accelerometerData = [];
	};

	_distanceToPointInM = (firstGeoPoint, secondGeoPoint) => {
		const deltaLat = this._toRad(firstGeoPoint.latitude - secondGeoPoint.latitude);
		const deltaLon = this._toRad(firstGeoPoint.longitude - secondGeoPoint.longitude);

		const a = Math.abs(
			Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
				Math.cos(this._toRad(secondGeoPoint.latitude)) *
					Math.cos(this._toRad(firstGeoPoint.longitude)) *
					(Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2))
		);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distanceInM = 6371 * c; // 6371 - Radius of the earth in km

		return Math.floor(distanceInM * 1000);
	};

	_toRad = value => {
		return value * (Math.PI / 180.0);
	};

	_toDeg = value => {
		return value / (Math.PI / 180.0);
	};
}

export default TrackingManager;
