import TrackingManager from '../managers/TrackingManager';
import { TIMERS_UPDATE_SUCCESS } from './types';

export const updateTimers = () => {
	return (dispatch, getState) => {
		const oldTimers = getState().timers;

		const newTimersState = {
			timeForRide: oldTimers.timeForRide + 1,
			totalTime: oldTimers.totalTime + 1,
			flagTimeStamp: oldTimers.flagTimeStamp,
			flagTotalTime: oldTimers.flagTotalTime,
			flagTimeForRide: oldTimers.flagTimeForRide,
		};

		dispatch({
			type: TIMERS_UPDATE_SUCCESS,
			payload: newTimersState,
		});
	};
};

export const saveTimeStamp = () => {
	return (dispatch, getState) => {
		const oldTimers = getState().timers;
		const timeNow = Date.now();

		TrackingManager.getInstance()._backgroundTimeValue = timeNow;

		const newTimersState = {
			timeForRide: oldTimers.timeForRide,
			totalTime: oldTimers.totalTime,
			flagTimeStamp: timeNow,
			flagTotalTime: oldTimers.totalTime,
			flagTimeForRide: oldTimers.timeForRide,
		};

		dispatch({
			type: TIMERS_UPDATE_SUCCESS,
			payload: newTimersState,
		});
	};
};

export const updateTimersFromTimeStamp = () => {

return (dispatch, getState) => {
		const oldTimers = getState().timers;
		const secondsPassed = Math.floor((Date.now() - oldTimers.flagTimeStamp) / 1000);

		const newTimersState = {
			timeForRide: oldTimers.flagTimeForRide + secondsPassed,
			totalTime: oldTimers.flagTotalTime + secondsPassed,
			flagTimeStamp: 0,
			flagTotalTime: 0,
			flagTimeForRide: 0,
		};

		dispatch({
			type: TIMERS_UPDATE_SUCCESS,
			payload: newTimersState,
		});
	};
};

