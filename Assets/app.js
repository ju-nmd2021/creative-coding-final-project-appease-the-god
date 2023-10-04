//Global Constants -------------------------------------------------
const SHOW_CAMERA = true;

//Global Variables -------------------------------------------------
let mouse;
let airParticles = [];
let video;
let handpose;
let predictions = [];
let newHand;

//cited from the handpose docutmentation at https://learn.ml5js.org/#/reference/handpose
const options = {
  flipHorizontal: true, // boolean value for if the video should be flipped, defaults to false
  maxContinuousChecks: Infinity, // How many frames to go without running the bounding box detector. Defaults to infinity, but try a lower value if the detector is consistently producing bad predictions.
  detectionConfidence: 0.8, // Threshold for discarding a prediction. Defaults to 0.8.
  scoreThreshold: 0.75, // A threshold for removing multiple (likely duplicate) detections based on a "non-maximum suppression" algorithm. Defaults to 0.75
  iouThreshold: 0.3, // A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
  };

//Setup ------------------------------------------------------------
function setup() {
  createCanvas(innerWidth, innerHeight);
  background(34, 39, 46);

  video = createCapture(VIDEO);
  video.size(640, 480);

  handpose = ml5.handpose(video, options, modelLoaded);
  handpose.on("hand", (results) => {
    predictions = results;
  });

  newHand = new Hand();
  for (let i = 0; i < 20; i++){
    for (let j = 0; j < 20; j++) {
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

  summonCameraTracking();
  if (newHand) {
    newHand.update();
    newHand.draw(); 
  }
  for (let particle of airParticles){
    particle.draw();
  }
}

//Misc Functions ----------------------------------------------------
function summonCameraTracking() { //cited from garritt's Handpose example: https://codepen.io/pixelkind/pen/BavQawB
  if (SHOW_CAMERA){
    image(video, 0, 0, 640, 480);
  }

  for (let hand of predictions) {
    const x1 = hand.boundingBox.topLeft[0];
    const y1 = hand.boundingBox.topLeft[1];
    const x2 = hand.boundingBox.bottomRight[0];
    const y2 = hand.boundingBox.bottomRight[1];
    push();
    noFill();
    stroke(0, 255, 0);
    rectMode(CORNERS);
    rect(x1, y1, x2, y2);
    pop();

    const landmarks = hand.landmarks;
    for (let landmark of landmarks) {
      push();
      noStroke();
      fill(0, 255, 0);
      ellipse(landmark[0], landmark[1], 10);
      pop();
    }
  }
}

function modelLoaded() {
  console.log("Model Loaded!");
}

/*TODOs -----------------------------------------------------------

Make the camera and controls mirrored
Make the camera invisible
Adjust the confidence levels and make the movements more fluid
Make hand skelleton (avatar)

*/