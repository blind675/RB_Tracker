# RB_Tracker
Mobile app for tracking small electric vehicles rides.
The data is sent to the [Google Firebase](https://https://firebase.google.com/) data-store and can be viewed on the [RB Tracking Website](https://blind675.github.io/RB_Tracker_stats/). From here the data will be labeled and used to train a Machine Learning model to determine automatically the action the rider did at a certain location.

![iOS screen shot](./screenshot.png?raw=true "Title")

### Build status

 iOS        : [![Build status](https://build.appcenter.ms/v0.1/apps/2c7d779b-749b-45d3-80bb-f98729889b6c/branches/master/badge)](https://appcenter.ms)

 Android    : [![Build status](https://build.appcenter.ms/v0.1/apps/492aaf97-38e9-487d-9c0f-a1d2dffe0fd5/branches/master/badge)](https://appcenter.ms)

### Download links

 iOS     : [Contact me](mailto:catalin.bora@gmail.com) ,because Apple testing is more complicated. 

 Android : [App Download Link](https://install.appcenter.ms/orgs/reactive-boards/apps/rbtracker-1/distribution_groups/rbstats%20android%20testers)

## Builds Commands

### Android
To generate an APK signed with development certificates run:
```
react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
cd android 
./gradlew clean
./gradlew assembleDebug
rm app/src/main/assets/index.android.bundle
cd ..
```
The resulting APK is found in ./android/app/build/outputs/apk/**debug**

To test that all was ok you should test install the resulting apk on an emulator.
Remove old APK from emulator first and run:
```
adb install android/app/build/outputs/apk/debug/app-debug.apk
```
