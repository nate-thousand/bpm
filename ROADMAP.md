
BPM + Key Finder Roadmap
Project Goal
Build a minimal browser based music utility that does three things well:
	1	Tap BPM using the keyboard space bar
	2	Detect approximate BPM using the microphone
	3	Estimate musical key using the microphone
The app should remain simple, focused, and lightweight.
No framework. No backend. No database. No accounts. No playlist system. No song library. No visualizer. No redesign.

⸻

Core Product Principle
The app should do one job clearly:
Help a user quickly estimate the tempo and key of music playing nearby.
The interface should stay simple enough that a user understands it immediately.

⸻

Locked Design Rule
The current visual design is already approved.
Do not change:
	•	Layout
	•	Colors
	•	Typography
	•	Spacing
	•	Button styles
	•	Section structure
	•	Visual direction
	•	Overall UI
Only change HTML when a missing ID, label, or attribute is required to wire functionality.
Functionality work should preserve the existing design exactly.

⸻

Phase 1: Project Inspection
Goal
Understand the existing app structure before changing code.
Tasks
	•	Inspect index.html
	•	Inspect css/styles.css
	•	Inspect all files in /js
	•	Identify existing DOM IDs
	•	Identify existing buttons
	•	Identify existing display elements
	•	Identify existing JavaScript imports and exports
	•	Find missing connections between UI and logic
Files Involved
	•	index.html
	•	css/styles.css
	•	css/signal9-theme.css
	•	css/preset-themes.css
	•	css/startup.css
	•	js/main.js
	•	js/tap-bpm.js
	•	js/mic-input.js
	•	js/bpm-detector.js
	•	js/key-detector.js
	•	js/audio-utils.js
Success Criteria
	•	Current app structure is understood
	•	Required UI hooks are identified
	•	No visual design changes are made

⸻

Phase 2: Tap BPM
Goal
Make manual tap tempo detection work using the space bar and on screen Tap button.
Requirements
The app must support:
	•	Space bar tap input
	•	On screen Tap button input
	•	Reset button
	•	Live BPM display
	•	Tap count display
	•	Stability or confidence display
	•	Automatic reset after a long pause
	•	Accidental double tap filtering
Behavior
On each valid tap:
	1	Store the tap timestamp using performance.now()
	2	Calculate the intervals between recent taps
	3	Average the recent intervals
	4	Convert the average interval to BPM
	5	Smooth the displayed BPM
	6	Update the UI
Rules
	•	Ignore taps closer than 150ms apart
	•	If more than 3000ms passes between taps, start a new tap session
	•	Use only the most recent 8 to 12 taps
	•	Prevent the space bar from scrolling the page
	•	Do not trigger a tap while the user is focused inside:
	◦	input
	◦	textarea
	◦	select
	◦	button
UI Updates
Update:
	•	Tap BPM value
	•	Tap count
	•	Tap stability
	•	Last tap state if available
Success Criteria
	•	Pressing space in rhythm produces a useful BPM estimate
	•	Clicking Tap produces the same result
	•	Reset clears the tap session
	•	Space bar does not scroll the page
	•	No console errors occur

⸻

Phase 3: Microphone Input
Goal
Enable the browser microphone and provide live audio data to the BPM and key detectors.
Requirements
The app must support:
	•	Start Listening button
	•	Stop Listening button
	•	Browser microphone permission request
	•	Live input level display
	•	Listening status display
	•	Clean microphone shutdown
Behavior
When Start Listening is clicked:
	1	Request microphone access with navigator.mediaDevices.getUserMedia({ audio: true })
	2	Create an AudioContext
	3	Create an AnalyserNode
	4	Connect the microphone stream to the analyser
	5	Start a requestAnimationFrame loop
	6	Update the input level
	7	Send audio data to the BPM detector
	8	Send frequency data to the key detector
When Stop Listening is clicked:
	1	Stop the animation loop
	2	Stop all microphone tracks
	3	Disconnect audio nodes where possible
	4	Update the listening status
	5	Prevent duplicate loops from continuing
Error Handling
Handle:
	•	Permission denied
	•	Missing browser microphone support
	•	Audio context creation failure
	•	Repeated start clicks
	•	Stop clicked before start
UI Updates
Update:
	•	Listening status
	•	Input level
	•	Start and Stop button state if already supported by the UI
Success Criteria
	•	User can start mic listening
	•	User can stop mic listening
	•	Input level responds to sound
	•	Microphone tracks stop correctly
	•	No duplicate audio loops are created

⸻

Phase 4: Microphone BPM Detection
Goal
Estimate approximate BPM from live microphone audio.
Requirements
The app must detect repeated rhythmic peaks from microphone input.
Detection Range
	•	Minimum BPM: 60
	•	Maximum BPM: 200
Behavior
Use time domain audio data to:
	1	Calculate current signal energy
	2	Maintain a rolling energy history
	3	Create an adaptive threshold
	4	Detect peaks above the threshold
	5	Store recent peak timestamps
	6	Calculate intervals between peaks
	7	Reject invalid intervals
	8	Estimate BPM from repeated intervals
	9	Smooth the BPM result
	10	Update confidence
Peak Detection Rules
	•	Use adaptive thresholding based on recent energy
	•	Ignore peaks that occur too close together
	•	Reject intervals outside the 60 to 200 BPM range
	•	Prefer stable repeated intervals
	•	Avoid jumping rapidly between unrelated BPM values
Confidence Levels
Use simple readable states:
	•	Waiting
	•	Low
	•	Medium
	•	High
UI Updates
Update:
	•	Mic BPM value
	•	Mic confidence
	•	Listening state
	•	Input level
Success Criteria
	•	Steady music near the mic returns an approximate BPM
	•	Noisy or unclear audio shows low confidence or waiting
	•	BPM output is smoothed
	•	No console errors occur

⸻

Phase 5: Musical Key Detection
Goal
Estimate the musical key from microphone frequency data.
Requirements
The app must estimate:
	•	Root note
	•	Major or minor mode
	•	Confidence
	•	Alternate possible keys
Behavior
Use frequency data to:
	1	Read analyser frequency bins
	2	Convert useful frequencies to pitch classes
	3	Build a 12 note chroma profile
	4	Smooth the chroma profile over time
	5	Compare the profile against major and minor key templates
	6	Choose the best matching key
	7	Return alternate matches
	8	Show Unknown when confidence is too low
Pitch Classes
Use the following note names:
	•	C
	•	C#
	•	D
	•	D#
	•	E
	•	F
	•	F#
	•	G
	•	G#
	•	A
	•	A#
	•	B
Frequency Rules
	•	Ignore frequencies below 60Hz
	•	Ignore frequencies above 5000Hz
	•	Normalize the chroma profile
	•	Reduce the impact of noise
	•	Avoid overconfident results
Key Templates
Use simple major and minor key profiles.
Expected output examples:
	•	C major
	•	A minor
	•	G minor
	•	F# minor
	•	Unknown
UI Updates
Update:
	•	Estimated key
	•	Mode
	•	Confidence
	•	Possible matches
Success Criteria
	•	The app displays an estimated key or Unknown
	•	Alternate key suggestions appear when available
	•	Confidence reflects uncertainty
	•	App does not claim perfect detection

⸻

Phase 6: Main App Wiring
Goal
Use js/main.js as the app controller without moving all logic into one file.
Responsibilities
main.js should:
	•	Import tap BPM logic
	•	Import microphone input logic
	•	Import BPM detector logic
	•	Import key detector logic
	•	Query DOM elements once during initialization
	•	Attach event listeners
	•	Update UI elements
	•	Start and stop microphone analysis loop
	•	Avoid duplicate event listeners
	•	Avoid duplicate animation loops
Module Responsibilities
tap-bpm.js
Handles manual tap tempo.
Core functions:
	•	recordTap()
	•	calculateTapBpm()
	•	resetTapBpm()
	•	getTapStats()
mic-input.js
Handles microphone access and audio setup.
Core functions:
	•	startMic()
	•	stopMic()
	•	getAudioData()
	•	getFrequencyData()
	•	getInputLevel()
bpm-detector.js
Handles microphone BPM detection.
Core functions:
	•	detectPeaks()
	•	estimateBpm()
	•	calculateBpmConfidence()
key-detector.js
Handles musical key estimation.
Core functions:
	•	buildChromaProfile()
	•	detectKey()
	•	compareToKeyProfiles()
	•	calculateKeyConfidence()
audio-utils.js
Contains shared helpers.
Core functions:
	•	frequencyToNote()
	•	noteToPitchClass()
	•	normalize()
	•	smoothValue()
	•	clamp()
Success Criteria
	•	Each module has a clear responsibility
	•	Main app wiring is easy to read
	•	App remains maintainable
	•	Functionality does not depend on visual redesign

⸻

Phase 7: Testing
Goal
Confirm the app works in browser with no design changes.
Local Server
Run from the project root:
python3 -m http.server 5173
Open:
http://localhost:5173
Do not rely on opening index.html directly.
Manual Test Checklist
Test:
	•	App loads with no console errors
	•	Space bar tap updates BPM
	•	Tap button updates BPM
	•	Reset clears tap BPM
	•	Space bar does not scroll the page
	•	Tap BPM resets after a long pause
	•	Accidental double taps are ignored
	•	Mic starts after permission approval
	•	Mic stops fully
	•	Input level responds to sound
	•	Mic BPM shows approximate values for steady music
	•	Key detection displays a key or Unknown
	•	Confidence states update
	•	No duplicate mic loops occur
	•	No design changes occurred
Success Criteria
	•	App runs locally
	•	Core features are wired
	•	Browser console is clean
	•	Existing design is preserved

⸻

Known Limitations
Tap BPM
Tap BPM should be reliable when the user taps consistently.
It may be inaccurate if the user taps unevenly or changes tempo during tapping.
Mic BPM
Microphone BPM detection is approximate.
Accuracy depends on:
	•	Room noise
	•	Microphone quality
	•	Music volume
	•	Drum clarity
	•	Tempo stability
	•	Song arrangement
Key Detection
Key detection is approximate and should be treated as a helpful estimate.
Accuracy depends on:
	•	Harmonic clarity
	•	Background noise
	•	Vocals
	•	Chord complexity
	•	Bass heavy mixes
	•	Key changes
	•	Microphone quality
The app should show Unknown when confidence is too low.

⸻

Future Enhancements
Only consider these after the core app works.
Possible Later Improvements
	•	Manual BPM nudge up and down
	•	Half time and double time BPM suggestions
	•	Key notation toggle between standard and Camelot
	•	Better smoothing controls
	•	Audio file upload analysis
	•	Calibration mode
	•	Improved confidence scoring
	•	Better transient detection
	•	Better chroma weighting
	•	Optional dark meter animation
Still Out of Scope
Do not add:
	•	Accounts
	•	Login
	•	Backend
	•	Database
	•	Song library
	•	Playlist system
	•	Streaming integrations
	•	AI chat
	•	Heavy visualizer
	•	DJ software integration
	•	Recording
	•	Social sharing

⸻

Definition of Done
The first complete version is done when:
	•	Tap BPM works from the space bar
	•	Tap BPM works from the Tap button
	•	Reset works
	•	Microphone starts and stops correctly
	•	Input level responds to sound
	•	Mic BPM produces approximate results
	•	Key detection produces an estimate or Unknown
	•	Confidence values update
	•	The browser console has no errors
	•	The app runs from a local static server
	•	The visual design remains unchanged
