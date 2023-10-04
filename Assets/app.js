//Global Variables -------------------------------------------------
let mouse;
let airParticles = [];
let video;
let handpose;
let predictions = [];
let newHand;

//Setup ------------------------------------------------------------
function setup() {
  createCanvas(innerWidth, innerHeight);
  background(34, 39, 46);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handpose = ml5.handpose(video, modelLoaded);
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
  image(video, 0, 0, 640, 480);

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