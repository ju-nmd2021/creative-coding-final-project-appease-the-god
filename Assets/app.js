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
  flipHorizontal: false,
  minConfidence: 0.5,
  maxPoseDetections: 5,
  scoreThreshold: 0.5,
  nmsRadius: 20,
  detectionType: 'single',
  inputResolution: 513,
  multiplier: 0.75,
  quantBytes: 2,
};

//Setup ------------------------------------------------------------
function setup() {
  createCanvas(innerWidth, innerHeight);
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

  newHand = new Hand();
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
  constructor(){
    this.position = createVector(mouseX, mouseY);
  }
  update(){
    this.position = createVector(mouseX, mouseY);
  }
  draw(){
    ellipse(this.position.x, this.position.y, 25);
  }
}

class AirParticle {
  constructor(x, y){
    this.position = createVector(x, y);
  }
  draw(){
    ellipse(this.position.x, this.position.y, 5);
  }
}

//Draw Function ----------------------------------------------------
function draw() {
  background(100, 100, 100);
  drawTracking();
  if (newHand) {
    newHand.update();
    newHand.draw(); 
  }
  for (let particle of airParticles){
    particle.draw();
  }
}

//Misc Functions ----------------------------------------------------
function drawTracking() { //cited from garritt's Handpose example: https://codepen.io/pixelkind/pen/BavQawB
  if (SHOW_CAMERA){
    push();
    // translate(640, 0);
    // scale(-1,1);
    image(video, 0, 0, 640, 480);
    pop();
  }

  for (let hand of predictions) {
    // const x1 = hand.boundingBox.topLeft[0];
    // const y1 = hand.boundingBox.topLeft[1];
    // const x2 = hand.boundingBox.bottomRight[0];
    // const y2 = hand.boundingBox.bottomRight[1];
    // push();
    // noFill();
    // stroke(0, 255, 0);
    // rectMode(CORNERS);
    // rect(x1, y1, x2, y2);
    // pop();

    // const landmarks = hand.landmarks;
    // for (let landmark of landmarks) {
    //   push();
    //   noStroke();
    //   fill(0, 255, 0);
    //   ellipse(landmark[0], landmark[1], 10);
    //   pop();
    // }
  }

  for (let pose of poses) {
    const keypoints = pose.pose.keypoints;
    for (let keypoint of keypoints) {
      if (keypoint.score > 0.4) {
        fill(0, 255, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 20);
      }
    }

    const skeleton = pose.skeleton;
    for (let part of skeleton) {
      stroke(0, 255, 0);
      line(
        part[0].position.x,
        part[0].position.y,
        part[1].position.x,
        part[1].position.y
      );
    }
  }
}

function modelLoaded() {
  console.log("Model Loaded!");
}

/*TODOs -----------------------------------------------------------

Change size of camera to match size of screen
Adjust the confidence levels and make the movements more fluid
Make hand skelleton (avatar)

*/