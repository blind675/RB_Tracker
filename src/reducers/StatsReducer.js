import { STATES_UPDATE_SUCCESS, STATES_RIDE_START, STATES_RIDE_END } from '../actions/types';

const INITIAL_STATE = {
	avgSpeed: 0,
	recordCount: 0,
	currentDistance: 0,
	maxSpeed: 0,
	totalDistance: 0,
	active: false,
};

export default (state = INITIAL_STATE, action) => {
	const payload = action.payload;
	switch (action.type) {
		case STATES_UPDATE_SUCCESS:
			return {
				...state,
				...payload,
			};
		case STATES_RIDE_START:
			return {
				...state,
				active: true,
			};
		case STATES_RIDE_END:
			return {
				...state,
				active: false,
			};
		default:
			return state;
	}
};
