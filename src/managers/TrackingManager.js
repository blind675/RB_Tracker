// @flow
import { accelerometer } from 'react-native-sensors';
import firebase from 'react-native-firebase';
import DeviceInfo from 'react-native-device-info';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';

import { updateStats } from '../actions/StatsActions';
import { stopRide } from '../actions/RidesActions';
import { saveData } from '../actions/StorageActions';

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
				stationaryRadius: 100,
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

			// console.log(' - new location: ', location);
			// console.log(' - old location: ', this.instance._lastGeoPoint);
			// console.log(' --------------- ');
			// console.log(' - new time    : ', location.time);
			// console.log(' - old time    : ', this.instance._lastTimestamp);
			// console.log(' - duration    : ', Math.floor((location.time - this.instance._lastTimestamp) / 1000));
			// console.log(' --------------- ');
			// console.log(' - distance    : ', this.instance._lastGeoPoint ? this.instance._distanceToPointInM(location, this.instance._lastGeoPoint) : '-');

			// only send locations with accuracy less then 15
			if (location.longitude && location.latitude && location.accuracy < 15) {
				if (this.instance._lastGeoPoint) {
					// calculate distance of 2 points
					const durationInSeconds = Math.floor((location.time - this.instance._lastTimestamp) / 1000);
					const distance = this.instance._distanceToPointInM(location, this.instance._lastGeoPoint);
					const speed = Math.floor(distance / durationInSeconds * 3.6 * 10) / 10;

					// don't send points in the same location
					if (distance < this.instance._lastGeoPoint.accuracy + location.accuracy) {
						// user is in the accuracy error zone
						// didn't move since last location reading
						// auto shut down if user in same location more than 5 min
						if (durationInSeconds > 300) {
							this.instance.stopTracking();
						}
					} else {
						// console.log(' - speed (mk/h): ',  speed);
						// user moved
						updateStats(distance, durationInSeconds);

						this.instance._lastTimestamp = location.time;
						this.instance._sendLocationToServer(location, speed);
					}
				} else {
					this.instance._lastTimestamp = location.time;
					this.instance._sendLocationToServer(location, -1);
				}
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

		this._lastDBEntryReference = null;
		this._backgroundTimeValue = null;

		this._serverTrackingApproved = false;

		this.instance = this;

		return this;
	}

	_sendLocationToServer = (location, speed) => {
		const time = new Date(location.time);

		const geoPoint: GeoPoint = {
			longitude: location.longitude,
			latitude: location.latitude,
			altitude: location.altitude,
			accuracy: location.accuracy,
			accelerometerData: this.instance._accelerometerData,
			uniqueId: DeviceInfo.getUniqueID(),
			manufacturer: DeviceInfo.getManufacturer(),
			speed: speed,
			time: time.toUTCString(),
			backgroundTimeValue: this.instance._backgroundTimeValue ? this.instance._backgroundTimeValue : 0,
		};

		if (this.instance._serverTrackingApproved) {
			// send data to firebase.. no need to call redux
			this.instance._lastDBEntryReference = firebase.firestore().collection('geo_points').add(geoPoint);
		}

		// cleanup
		this.instance._accelerometerData = [];
		this.instance._lastGeoPoint = geoPoint;
	};

	_addAccelerometer = accelerometerObject => {
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
		// setUpdateIntervalForType(SensorTypes.accelerometer, 400);
		this._accelerometerObserver = accelerometer.subscribe(data => {
			// create new accelerometer object
			const accelerometerObject = {
				x: data.x,
				y: data.y,
				z: data.z,
			};

			this._addAccelerometer(accelerometerObject);
		});

		BackgroundGeolocation.start();
	};

	stopTracking = () => {
		stopRide();

		saveData();

		if (this._accelerometerObserver) {
			this._accelerometerObserver.unsubscribe();
		}

		BackgroundGeolocation.stop();
		BackgroundGeolocation.removeAllListeners();

		// clear last entry
		if (this.instance._lastDBEntryReference) {
			firebase.firestore().collection('geo_points').update(this.instance._lastDBEntryReference);
		}

		this.instance._lastDBEntryReference = null;

		//clear timestamp
		this._lastTimestamp = null;
		this._lastGeoPoint = null;
		this._accelerometerData = [];

		// TODO: set a local notification in 90 min to remind user to view website
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
