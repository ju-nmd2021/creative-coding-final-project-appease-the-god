//Global Constants -------------------------------------------------
const SHOW_CAMERA = true;
const PARTICLE_COUNT = 0;

//Global Variables -------------------------------------------------
let mouse;
let airParticles = [];
let video;
let handpose;
let predictions = [];
let newHand;
let hands = []; 
let poseNet;
let poses = [];

//cited from the handpose docutmentation at https://learn.ml5js.org/#/reference/handpose
const options = {
  flipHorizontal: true, // boolean value for if the video should be flipped, defaults to false
  maxContinuousChecks: Infinity, // How many frames to go without running the bounding box detector. Defaults to infinity, but try a lower value if the detector is consistently producing bad predictions.
  detectionConfidence: 0.8, // Threshold for discarding a prediction. Defaults to 0.8.
  scoreThreshold: 0.75, // A threshold for removing multiple (likely duplicate) detections based on a "non-maximum suppression" algorithm. Defaults to 0.75
  iouThreshold: 0.3, // A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
};

const options2 = {
  architecture: 'MobileNetV1',
  imageScaleFactor: 0.3,
  outputStride: 16,
  flipHorizontal: true,
  minConfidence: 0.5,
  maxPoseDetections: 5,
  scoreThreshold: 0.5,
  nmsRadius: 20,
  detectionType: 'single',
  inputResolution: 513,
  multiplier: 1.00,
  quantBytes: 4,
};

//Setup ------------------------------------------------------------
function setup() {
  createCanvas(innerWidth, innerHeight);
  colorMode(HSB, 255);
  background(34, 39, 46);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  frameRate(60);

  // handpose = ml5.handpose(video, options, modelLoaded);
  // handpose.on("hand", (results) => {
  //   predictions = results;
  // });

  poseNet = ml5.poseNet(video, options2, modelLoaded); // single can be changed to multiple
  poseNet.on("pose", (results) => {
    poses = results;
  });

  mouseHand = new Hand("mouse", 250);
  hands.push(mouseHand);
  for (let i = 0; i < PARTICLE_COUNT; i++){
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      let newParticle = new AirParticle(i * 50, j * 50);
      airParticles.push(newParticle);
    }
  }
  mouse = createVector(mouseX, mouseY);
}

//Classes ----------------------------------------------------------
class Hand {
  constructor(title, hue){
    this.position = createVector(100, 100);
    this.title = title;
    this.hue = hue;
  }
  update(newX, newY){
    this.position = createVector(newX, newY);
  }
  draw(){
    push()
    fill(this.hue, 255, 255);
    ellipse(this.position.x, this.position.y, 25);
    pop()
  }
}

//Draw Function ----------------------------------------------------
function draw() {
  background(100, 100, 100);
  if (SHOW_CAMERA){
    push();
    translate(640, 0);
    scale(-1,1);
    image(video, 0, 0, 640, 480);
    pop();
  }

  // drawTracking();

  if (poses[0]){
    for (let hand of hands) {
      switch(hand.title){
        case "mouse": hand.update(mouseX, mouseY); break;
        case "leftWrist": 
        if (poses[0].pose.leftWrist.confidence > 0.6){
          hand.update(poses[0].pose.leftWrist.x, poses[0].pose.leftWrist.y); break;
        }
        case "rightWrist": 
        if (poses[0].pose.leftWrist.confidence > 0.6) {
          hand.update(poses[0].pose.rightWrist.x, poses[0].pose.rightWrist.y); break;
        }
        default: break;
      }
      hand.draw(); 
    }
  }
}

//Misc Functions ----------------------------------------------------

function modelLoaded() {
  leftHand = new Hand("leftWrist", 50);
  rightHand = new Hand("rightWrist", 150);
  hands.push(leftHand, rightHand);
  console.log("Model Loaded!");
}

/*TODOs -----------------------------------------------------------

Change size of camera to match size of screen 
  - might be done with .imageScaleFactor
Adjust the confidence levels and make the movements more fluid
Make hand skelleton (avatar)

*/