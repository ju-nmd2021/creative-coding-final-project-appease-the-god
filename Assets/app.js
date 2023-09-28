//Global Variables
let mouse;

//Setup
function setup() {
  createCanvas(innerWidth, innerHeight);
  background(34, 39, 46);
  mouse = createVector(mouseX, mouseY);
}

//Classes
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

//class creations
let newHand = new Hand();

//Draw function
function draw() {
  background(100, 100, 100);
  newHand.update();
  newHand.draw();
}