import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DeviceInfo from 'react-native-device-info';

type Props = {};

class AboutScreen extends Component<Props> {
	render() {
		return (
			<View style={styles.screenContainer}>
				<Text style={styles.textStyle}>
					This app is a simple tracking app for ©Reactive Boards. For more details please visit
					www.reactive-boards.com
				</Text>
				<Text style={styles.textStyle}>Build version: {DeviceInfo.getVersion()}</Text>
				<Text style={styles.textStyle}>Current time: {Date.now()} ( for test )</Text>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		margin: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	textStyle: {
		color: '#404040',
		fontSize: 18,
	},
});

export default AboutScreen;
