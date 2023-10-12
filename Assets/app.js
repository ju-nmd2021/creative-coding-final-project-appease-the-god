//Global Constants -------------------------------------------------
const SHOW_CAMERA = true;
const PARTICLE_COUNT = 0;
const N = 50;
const SCALE = 10;
const DENS_DECAY = 0.08;
const VISCOSITY = 0.985;

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
let fluid;
let t;
let leftHand;
let rightHand;
let prevX, prevY;

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
  createCanvas(N * SCALE, N * SCALE);
  colorMode(HSB, 255);
  // background(34, 39, 46);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  frameRate(60);
  noStroke();
  fluid = new Fluid(N, N, ceil(width / N), 0.05, 0.8);
    
  t = 0;

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
  
  // mouse = createVector(mouseX, mouseY);
}

//Classes ----------------------------------------------------------
class Hand {
  constructor(title, hue){
    this.position = createVector(0, 0);
    this.title = title;
    this.hue = hue;
  }
  update(newX, newY){
    this.position.x = newX;
    this.position.y = newY;
  }
  draw(){
    push()
    fill(this.hue, 255, 255);
    ellipse(this.position.x, this.position.y, 25);
    pop()
  }
}

class Fluid {
  constructor(w, h, size, k, nu){
      this.w = w;
      this.h = h;
      this.size = size;
      this.k = k;
      this.nu = nu;
      
      this.density = [];
      this.velocity = [];
      for(let i = 0; i < this.w; ++i){
          this.density.push([]);
          this.velocity.push([]);
          for(let j = 0; j < this.h; ++j){
              this.density[i].push(0);
              /*let u = createVector(i - this.w/2, j - this.h/2);
              let a = u.heading() + HALF_PI;
              let v = createVector(cos(a), sin(a));
              v.mult(u.mag() * 10);*/
              this.velocity[i].push(createVector(0,0));
          }
      }
  }
  
  simulate(dt){
          let xs = [];
          let ys = [];
          for(let i = 0; i < this.w; ++i){
              xs.push([]);
              ys.push([]);
              for(let j = 0; j < this.h; ++j){
              xs[i].push(this.velocity[i][j].x);
              ys[i].push(this.velocity[i][j].y);
              }
      }
      
      this.diffuse(xs, this.nu, dt);
      this.diffuse(ys, this.nu, dt);
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              // this.velocity[i][j] = createVector(xs[i][j], ys[i][j]);
              this.velocity[i][j].x = xs[i][j];
              this.velocity[i][j].y = ys[i][j];
          }
      }
      
      this.clearDivergence();
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              xs[i][j] = this.velocity[i][j].x;
              ys[i][j] = this.velocity[i][j].y;
          }
      }
      
      this.advect(xs, dt);
      this.advect(ys, dt);
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              // this.velocity[i][j] = createVector(xs[i][j], ys[i][j]);
              this.velocity[i][j].x = xs[i][j];
              this.velocity[i][j].y = ys[i][j];
          }
      }
      
      this.clearDivergence();
      
      this.diffuse(this.density, this.k, dt);
      this.advect(this.density, dt);
  }
      
  diffuse(grid, coef, dt){
      let a = dt * coef;
      
      for(let k = 0; k < 10; ++k){
          for(let i = 0; i < this.w; ++i){
              for(let j = 0; j < this.h; ++j){
                  
                  let top     = grid[i][wrap(j + 1, this.h)];
                  let bottom  = grid[i][wrap(j - 1, this.h)];
                  let left    = grid[wrap(i - 1, this.w)][j];
                  let right   = grid[wrap(i + 1, this.w)][j];
                  
                  let curVal = grid[i][j];
                  
                  let newVal = curVal + a * (top + bottom + left + right);
                  newVal /= 4 * a + 1;
                  
                  grid[i][j] = newVal;
              }
          }
      }
  }
  
  advect(grid, dt) {
      let f = createVector(0, 0);
      let fj = createVector(0, 0);
      let fi = createVector(0, 0);
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
          let v = this.velocity[i][j].copy();
          let x = i * this.size;// + this.size/2;
          let y = j * this.size;// + this.size/2;
          // let f = createVector(x, y);
          f.x = x;
          f.y = y;
          v.mult(dt);
          f.sub(v);
          f.mult(1 / this.size);
          f.x = wrap(f.x, this.w);
          f.y = wrap(f.y, this.h);
          // f = createVector(wrap(f.x, this.w), wrap(f.y, this.h));
          // let fi = createVector(floor(f.x), floor(f.y));
          // let fj = createVector(fract(f.x), fract(f.y));
          // fi.x = floor(f.x);
          // fi.y = floor(f.y);
          fi.x = ~~f.x;
          fi.y = ~~f.y;
          fj.x = f.x - fi.x;// fract(f.x);
          fj.y = f.y - fi.y; // fract(f.y);
          
          let z1 = lerp(grid[fi.x][fi.y],
                          grid[wrap(fi.x + 1, this.w)][fi.y],
                          fj.x);
          let z2 = lerp(grid[fi.x][wrap(fi.y + 1, this.h)],
                          grid[wrap(fi.x + 1, this.w)][wrap(fi.y + 1, this.h)],
                          fj.x);
          
          let newVal = lerp(z1, z2, fj.y);
          
          grid[i][j] = newVal;
          }
      }
  }
  
  clearDivergence(){
      let div = [];
      let p = [];
      //let h = 1/this.w;
      
      for(let i = 0; i < this.w; ++i){
          div.push([]);
          p.push([]);
          for(let j = 0; j < this.h; ++j){
          let d = this.velocity[wrap(i + 1, this.w)][j].x - 
                  this.velocity[wrap(i - 1, this.w)][j].x +
                  this.velocity[i][wrap(j + 1, this.h)].y - 
                  this.velocity[i][wrap(j - 1, this.h)].y;
          d /= 2;
          div[i].push(d);
          p[i].push(0);
          }
      }
      
      for(let k = 0; k < 20; ++k) {
          for(let i = 0; i < this.w; ++i){
              for(let j = 0; j < this.h; ++j){
                  p[i][j] = -div[i][j] +
                          p[wrap(i - 1, this.w)][j] + p[wrap(i + 1, this.w)][j] +
                          p[i][wrap(j - 1, this.h)] + p[i][wrap(j + 1, this.h)];
                  p[i][j] /= 4;
              }
          }
      }
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              this.velocity[i][j].x -= 0.5 * (p[wrap(i + 1, this.w)][j] -
                                              p[wrap(i - 1, this.w)][j]);
              this.velocity[i][j].y -= 0.5 * (p[i][wrap(j + 1, this.h)] -
                                              p[i][wrap(j - 1, this.h)]);
          }
      }
  }
  
  show(showVel){
      // noStroke();
      // noFill();
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              let x = i * this.size;
              let y = j * this.size;
              if (this.density[i][j] > 0.1) {
                  fill(255 * this.density[i][j]);
                  rect(x, y, SCALE, SCALE, SCALE);
              }
          }
      }
      
      if(!showVel) return;
      
      fill(255,0,0);
      stroke(255, 0, 0);
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              let vel = this.velocity[i][j];
              if(vel.magSq() == 0) continue;
              let x = i * this.size + this.size/2;
              let y = j * this.size + this.size/2;
              arrow(createVector(x, y), vel);
          }
      }
  }
}

//Draw Function ----------------------------------------------------
function draw() {
  background(0);
  // if (SHOW_CAMERA){
  //   push();
  //   translate(640, 0);
  //   scale(-1,1);
  //   image(video, 0, 0, 640, 480);
  //   pop();
  // }

  // drawTracking();

  if (poses[0]){
    for (let hand of hands) {
      switch(hand.title){
        case "mouse": hand.update(mouseX, mouseY); break;
        case "leftWrist": 
        if (poses[0].pose.leftWrist.confidence > 0.6){
          hand.update(poses[0].pose.leftWrist.x, poses[0].pose.leftWrist.y); 
          break;
        }
        case "rightWrist": 
        if (poses[0].pose.leftWrist.confidence > 0.6) {
          hand.update(poses[0].pose.rightWrist.x, poses[0].pose.rightWrist.y); 
          break;
        }
        default: break;
      }
      hand.draw(); 
    }
  }
  
  let dt = frameRate() > 0 ? 1 / frameRate() : 0;

  fluid.simulate(dt);
  fluid.show(false);
  for(let i = 0; i < fluid.w; i++) {
    for(let j = 0; j < fluid.h; j++){
        fluid.density[i][j] -= DENS_DECAY * dt;
        fluid.velocity[i][j].mult(VISCOSITY);
    }
  }
  
  
  if (modelLoaded()) {
    let x = constrain(floor(leftHand.position.x/SCALE), 0, N-1);
    let y = constrain(floor(leftHand.position.y/SCALE), 0, N-1);

    console.log(leftHand.position);

    let amtX = leftHand.position.x - prevX;
    let amtY = leftHand.position.y - prevY;
    fluid.density[x][y] = 15;
    fluid.velocity[x][y].add(createVector(100 * amtX, 100 * amtY));
  }
  
  prevX = leftHand.position.x;
  prevY = leftHand.position.y;

  // console.log(leftHand.position.x, leftHand.position.y);
}

//Misc Functions ----------------------------------------------------

function modelLoaded() {
  leftHand = new Hand("leftWrist", 50);
  rightHand = new Hand("rightWrist", 150);
  hands.push(leftHand, rightHand);
  console.log("Model Loaded!");
  return true;
}

function wrap(x, m){
  return (x + m) % m;
}

function arrow(pos, dir){
  line(pos.x, pos.y, pos.x + dir.x, pos.y + dir.y);
  push();
  translate(pos.x + dir.x, pos.y + dir.y);
  rotate(dir.heading() - HALF_PI);
  triangle(-3,-2, 3,-2, 0,4);
  pop();
}

// function mouseDragged() { 
//   let x = constrain(floor(mouseX/SCALE), 0, N-1);
//   let y = constrain(floor(mouseY/SCALE), 0, N-1);
  
//   let amtX = mouseX - pmouseX;
//   let amtY = mouseY - pmouseY;
//   fluid.density[x][y] = 15;
//   fluid.velocity[x][y].add(createVector(100 * amtX, 100 * amtY));
// }

/*TODOs -----------------------------------------------------------

Change size of camera to match size of screen 
  - might be done with .imageScaleFactor
Adjust the confidence levels and make the movements more fluid
Make hand skelleton (avatar)

*/