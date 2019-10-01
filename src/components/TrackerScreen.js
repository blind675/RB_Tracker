import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import Permissions from 'react-native-permissions';
import FlipToggle from 'react-native-flip-toggle-button';
import Icon from 'react-native-vector-icons/FontAwesome';
import { connect } from 'react-redux';

import * as actions from '../actions';
import TrackingManager from '../managers/TrackingManager';

type Props = {};

class TrackerScreen extends Component<Props> {
	constructor(props) {
		super(props);
		this.state = {
			appState: AppState.currentState,
		};
		this.timer = null;
	}

	componentDidMount(): void {
		Permissions.check('location', { type: 'always' }).then(response => {
			// Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
			if (response === 'undetermined') {
				this._requestPermission();
			}
		});
		this.props.loadData();

		AppState.addEventListener('change', this._handleAppStateChange);
	}

	componentWillUnmount() {
		AppState.removeEventListener('change', this._handleAppStateChange);
	}

	_handleAppStateChange = nextAppState => {
		if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
			console.log(' - return from background');
			if (!this.props.stats.active) {
				clearInterval(this.timer);
			} else {
				this.props.updateTimersFromTimeStamp();
				this.timer = setInterval(() => {
					this.props.updateTimers();
				}, 1000);
			}
		}

		if (this.state.appState.match(/inactive|background/) && nextAppState === 'background') {
			console.log(' - enter background');
			this.props.saveTimeStamp();
			clearInterval(this.timer);
		}

		this.setState({ appState: nextAppState });
	};

	// Request permission to access location
	_requestPermission = () => {
		Permissions.request('location', { type: 'always' }).then(response => {
			// Returns once the user has chosen to 'allow' or to 'not allow' access
			// Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
		});
	};

	_convertMetersToKm(meters): number {
		return Math.floor(meters / 10) / 100;
	}

	_prettyPrintTime(time, extended = false): string {
		var hours = Math.floor(time / 3600);
		var minutes = Math.floor(time / 60);
		var seconds = time - minutes * 60;

		if (extended || hours > 0) {
			return (
				this._str_pad_left(hours, '0', 2) +
				':' +
				this._str_pad_left(minutes, '0', 2) +
				':' +
				this._str_pad_left(seconds, '0', 2)
			);
		}

		return this._str_pad_left(minutes, '0', 2) + ':' + this._str_pad_left(seconds, '0', 2);
	}

	_str_pad_left(string, pad, length): string {
		return (new Array(length + 1).join(pad) + string).slice(-length);
	}

	render() {
		return (
			<View style={styles.screenContainer}>
				<View style={styles.flexOne} />
				<View style={styles.statusRow}>
					<Text> Status: </Text>
					<Text style={this.props.stats.active ? styles.trackingStatus : styles.notTrackingStatus}>
						{this.props.stats.active ? 'Tracking' : 'Stopped'}
					</Text>
				</View>
				<View style={styles.flexOne} />
				<View style={styles.row}>
					<Text> Avg speed: </Text>
					<Text style={styles.accentValuesLabels}>
						{`${this.props.stats.avgSpeed} km/h`}
					</Text>
				</View>
				<View style={styles.row}>
					<Text> Current distance: </Text>
					<Text style={styles.valuesLabels}>
						{`${this._convertMetersToKm(this.props.stats.currentDistance)} km`}
					</Text>
				</View>
				<View style={styles.row}>
					<Text> Time for ride: </Text>
					<Text style={styles.valuesLabels}>
						{this._prettyPrintTime(this.props.timers.timeForRide)}
					</Text>
				</View>
				<View style={styles.flexOne} />
				<View style={styles.row}>
					<Text> Max speed: </Text>
					<Text style={styles.accentValuesLabels}>
						{`${this.props.stats.maxSpeed} km/h`}
					</Text>
				</View>
				<View style={styles.row}>
					<Text> Total distance: </Text>
					<Text style={styles.valuesLabels}>
						{`${this._convertMetersToKm(this.props.stats.totalDistance)} km`}
					</Text>
				</View>
				<View style={styles.row}>
					<Text> Total time: </Text>
					<Text style={styles.valuesLabels}>
						{this._prettyPrintTime(this.props.timers.totalTime, true)}
					</Text>
				</View>
				<View style={styles.row}>
					<Text> Total rides: </Text>
					<Text style={styles.valuesLabels}>
						{this.props.rides}
					</Text>
				</View>
				<View style={styles.flexOne} />
				<View style={styles.row}>
					<View style={styles.sliderBorder}>
						<FlipToggle
							value={this.props.stats.active}
							buttonWidth={270}
							buttonHeight={50}
							buttonRadius={0}
							sliderWidth={60}
							sliderHeight={40}
							sliderRadius={0}
							onLabel={'Stop'}
							offLabel={'Track'}
							sliderOnColor={'#F0592A'}
							sliderOffColor={'#BEBEBE'}
							buttonOnColor={'#FFFFFF'}
							buttonOffColor={'#FFFFFF'}
							labelStyle={styles.sliderLabel}
							onToggle={newState => {
								if (!this.props.stats.active) {
									TrackingManager.getInstance().startTracking();
									this.timer = setInterval(() => {
										this.props.updateTimers();
									}, 1000);
									this.props.startNewRide();
								} else {
									TrackingManager.getInstance().stopTracking();
									// TODO: this will be a bug.. move this elsewhere.
									clearInterval(this.timer);
									this.props.saveData();
								}
							}}
						/>
					</View>
					<TouchableOpacity
						style={styles.buttonBorder}
						onPress={() => {
							TrackingManager.getInstance().stopTracking();
							clearInterval(this.timer);
							this.props.clearData();
						}}
					>
						<Icon name="trash" size={30} color="red" />
					</TouchableOpacity>
				</View>
				<View style={styles.flexOne} />
			</View>
		);
	}
}

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		margin: 16,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	statusRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 30,
	},
	flexOne: {
		flex: 1,
	},
	sliderBorder: {
		borderColor: '#A0A0A0',
		borderWidth: 1,
	},
	sliderLabel: {
		color: '#808080',
		fontSize: 17,
		fontWeight: '500',
	},
	buttonBorder: {
		width: 50,
		height: 50,
		borderColor: '#A0A0A0',
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	trackingStatus: {
		color: '#F0592A',
		fontSize: 22,
		fontWeight: '700',
	},
	notTrackingStatus: {
		fontSize: 20,
		fontWeight: '500',
	},
	valuesLabels: {
		fontSize: 17,
		marginVertical: 4,
		marginRight: 2,
	},
	accentValuesLabels: {
		fontSize: 17,
		fontWeight: '700',
		marginVertical: 4,
		marginRight: 2,
	},
});

const mapStateToProps = state => ({
	stats: state.stats,
	timers: state.timers,
	rides: state.rides,
});

export default connect(mapStateToProps, actions)(TrackerScreen);
