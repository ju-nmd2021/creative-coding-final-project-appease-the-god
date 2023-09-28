//Global Variables -------------------------------------------------
let mouse;
let airParticles = [];

//Setup ------------------------------------------------------------
function setup() {
  createCanvas(innerWidth, innerHeight);
  background(34, 39, 46);
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

//Class Creations -------------------------------------------------
let newHand = new Hand();
let newParticle = new AirParticle(200, 200);
airParticles.push(newParticle);

//Draw Function ----------------------------------------------------
function draw() {
  background(100, 100, 100);
  newHand.update();
  newHand.draw();
  for (let particle of airParticles){
    particle.draw();
  }
}

//Misc Functions ----------------------------------------------------