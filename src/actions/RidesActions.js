import {
	TIMERS_UPDATE_SUCCESS,
	STATES_UPDATE_SUCCESS,
	RIDES_UPDATE_SUCCESS,
	STATES_RIDE_START,
	STATES_RIDE_END,
} from './types';
import store from '../Store';

export const stopRide = () => {
    store.dispatch({
		type: STATES_RIDE_END,
	});
};

export const startNewRide = () => {
	return (dispatch, getState) => {
		const { timers, rides } = getState();

		dispatch({
			type: STATES_RIDE_START,
		});

		dispatch({
			type: TIMERS_UPDATE_SUCCESS,
			payload: {
				...timers,
				timeForRide: 0,
			},
		});

		dispatch({
			type: STATES_UPDATE_SUCCESS,
			payload: {
				avgSpeed: 0,
				recordCount: 0,
				currentDistance: 0,
			},
		});

		dispatch({
			type: RIDES_UPDATE_SUCCESS,
			payload: rides + 1,
		});
	};
};
