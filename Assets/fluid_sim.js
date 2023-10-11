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
                this.velocity[i][j] = createVector(xs[i][j], ys[i][j]);
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
                this.velocity[i][j] = createVector(xs[i][j], ys[i][j]);
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
        for(let i = 0; i < this.w; ++i){
            for(let j = 0; j < this.h; ++j){
            let v = this.velocity[i][j].copy();
            let x = i * this.size;// + this.size/2;
            let y = j * this.size;// + this.size/2;
            let f = createVector(x, y);
            v.mult(dt);
            f.sub(v);
            f.mult(1 / this.size);
            f = createVector(wrap(f.x, this.w), wrap(f.y, this.h));
            let fi = createVector(floor(f.x), floor(f.y));
            let fj = createVector(fract(f.x), fract(f.y));
            
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
        noStroke();
        noFill();
        for(let i = 0; i < this.w; ++i){
            for(let j = 0; j < this.h; ++j){
                let x = i * this.size;
                let y = j * this.size;
                fill(255 * this.density[i][j]);
                rect(x, y, x + this.size, y + this.size);
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

const N = 40;
const SCALE = 10;
const DENS_DECAY = 0.05;
const VESCOCITY = 0.985;
let fluid;
let t;

function setup() {
    createCanvas(N * SCALE, N * SCALE, WEBGL);
    
    fluid = new Fluid(N, N, ceil(width / N), 0.05, 0.8);
    
    t = 0;
}

function draw() {
    background(0);
    translate(-N * SCALE/2, -N * SCALE/2)
    
    let dt = frameRate() > 0 ? 1 / frameRate() : 0;
    
    fluid.simulate(dt);

    // let x = floor(fluid.w / 2);
    // let y = floor(fluid.h / 2);
    // fluid.density[x][y] = 1;
    // let nt = noise(t)*TWO_PI*2;
    // fluid.velocity[x][y].add(createVector(1000*cos(nt),1000*sin(nt)));
    
    fluid.show(false);
    // fluid.show(true);
    
    for(let i = 0; i < fluid.w; i++) {
        for(let j = 0; j < fluid.h; j++){
            fluid.density[i][j] -= DENS_DECAY * dt;
            fluid.velocity[i][j].mult(VESCOCITY);
        }
    }

    // console.log(frameRate())
    
    t += dt;
}

function mouseDragged() { 
    let x = constrain(floor(mouseX/SCALE), 0, N-1);
    let y = constrain(floor(mouseY/SCALE), 0, N-1);
    
    let amtX = mouseX - pmouseX;
    let amtY = mouseY - pmouseY;
    fluid.density[x][y] = 15;
    fluid.velocity[x][y].add(createVector(100 * amtX, 100 * amtY));
}