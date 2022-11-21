canvcreate("", 500, 500);
canv.width = window.innerWidth;
canv.height = window.innerHeight;
window.onresize = function () {
	canv.width = window.innerWidth;
	canv.height = window.innerHeight;
}

var startTime = new Date();
var deltaTime = 0;
var frame = 0;
var rFps = 0;

var frameCountForSample = 5;
var fps = 0;

var lockedPs = [];

function distanceToLine(target, p1, p2) {
	let delta = [p2[0] - p1[0], p2[1] - p1[1]];
	let M = Math.sqrt(delta[0]**2+delta[1]**2);
	let N = [delta[0]/M,delta[1]/M];

	let tInLine = -(N[0]*(p1[0] - target[0])+N[1]*(p1[1] - target[1]));
	tInLine /= M;

	if (tInLine < 0) {
		// return math.magnitude([p1[0] - target[0], p1[1] - target[1]]);
		return Math.sqrt((p1[0] - target[0])**2+(p1[1] - target[1])**2);
	} 
	if (tInLine > 1) {
		// return math.magnitude([p2[0] - target[0], p2[1] - target[1]]);
		return Math.sqrt((p2[0] - target[0])**2+(p2[1] - target[1])**2);
	}
	// let tFromLine = math.dot(N, [-target[1] + p1[1], target[0] - p1[0]]);
	let tFromLine = N[0]*(p1[1]-target[1])+N[1]*(target[0]-p1[0]);
	return Math.abs(tFromLine);
}

class Point {
	constructor(id = -1, position = [0, 0]) {
		this.id = id;
		this.position = position;
		this.joints = [];
	}
}
class Tree {
	constructor(points) {
		this.points = points; // class Point

	}
	MakeByTree(JointsFunc, PointsFunc) { //JointsFunc = (point, joint) | PointsFunc = (point) 
		if (this.points.length < 1) return;
		let nextPoints = [];
		let pastPoints = [];
		nextPoints[0] = this.points[0];

		while (nextPoints.length > 0) {
			let newPoints = [];
			for (let i = 0; i < nextPoints.length; i++) {
				PointsFunc(nextPoints[i]);
				for (let j = 0; j < nextPoints[i].joints.length; j++) {
					if (!newPoints.includes(nextPoints[i].joints[j])) {
						if (!pastPoints.includes(nextPoints[i].joints[j]) && !nextPoints.includes(nextPoints[i].joints[j]))
							newPoints.push(nextPoints[i].joints[j]);
						JointsFunc(nextPoints[i], nextPoints[i].joints[j]);
					}
				}
				pastPoints.push(nextPoints[i]);
			}
			nextPoints = newPoints;
		}
	}
	Draw() {
		ctx.strokeStyle = "white";
		ctx.beginPath();
		this.MakeByTree((p, j) => {
			ctx.moveTo(p.position[0], p.position[1]);
			ctx.lineTo(j.position[0], j.position[1]);
		}, (p) => { });
		ctx.stroke();
		for (let i = 0; i < this.points.length; i++) {
			d.circle(this.points[i].position[0],this.points[i].position[1],2,"yellow");
			if (selectedPoint == i) {
				d.circle(this.points[i].position[0],this.points[i].position[1],8,"black","yellow",1,false);
			}
		}
	}
	DrawVolume(C = 10, stepSize = 5) {
		let activePoints = [];
		let pastPoints = [];
		let lockedPoints = [];

		this.MakeByTree((p, j) => {
			p = p.position;
			j = j.position;
			let delta = [j[0] - p[0], j[1] - p[1]];
			let m = math.magnitude(delta);
			for (let i = 0; i < m; i += 5) {
				let P = [	Math.floor((p[0]+delta[0]/m*i)/stepSize)*stepSize, 
							Math.floor((p[1]+delta[1]/m*i)/stepSize)*stepSize];
				let d = this.DistanceToTree0(P);
				let inc = false;
				for (let j = 0; j < activePoints.length; j++) {
					if (activePoints[j][0] == P[0] && activePoints[j][1] == P[1]) {
						inc = true;
						break;
					}
				}
				if (!inc)
					activePoints.push([P[0],P[1],d]);
			}
		}, (p) => { });

		let iter = 0;
		while (true) {
			// console.log("iter: "+iter);
			// console.log(pastPoints);
			let newPoints = [];
			for (let i = 0; i < activePoints.length; i++) {

				let P1 = [activePoints[i][0]+stepSize,activePoints[i][1]];
				let P2 = [activePoints[i][0]-stepSize,activePoints[i][1]];
				let P3 = [activePoints[i][0],activePoints[i][1]+stepSize];
				let P4 = [activePoints[i][0],activePoints[i][1]-stepSize];

				let D1 = this.DistanceToTree0(P1);
				let D2 = this.DistanceToTree0(P2);
				let D3 = this.DistanceToTree0(P3);
				let D4 = this.DistanceToTree0(P4);

				let include11 = false;
				let include12 = false;
				let include13 = false;
				let include14 = false;
				for (let j = 0; j < pastPoints.length; j++) {
					if (pastPoints[j][0] == P1[0] && pastPoints[j][1] == P1[1]) {
						include11 = true;
						continue;
					}
					if (pastPoints[j][0] == P2[0] && pastPoints[j][1] == P2[1]) {
						include12 = true;
						continue;
					}
					if (pastPoints[j][0] == P3[0] && pastPoints[j][1] == P3[1]) {
						include13 = true;
						continue;
					}
					if (pastPoints[j][0] == P4[0] && pastPoints[j][1] == P4[1]) {
						include14 = true;
						continue;
					}
				}

				let include21 = false;
				let include22 = false;
				let include23 = false;
				let include24 = false;
				for (let j = 0; j < newPoints.length; j++) {
					if (newPoints[j][0] == P1[0] && newPoints[j][1] == P1[1]) {
						include21 = true;
						continue;
					}
					if (newPoints[j][0] == P2[0] && newPoints[j][1] == P2[1]) {
						include22 = true;
						continue;
					}
					if (newPoints[j][0] == P3[0] && newPoints[j][1] == P3[1]) {
						include23 = true;
						continue;
					}
					if (newPoints[j][0] == P4[0] && newPoints[j][1] == P4[1]) {
						include24 = true;
						continue;
					}
				}

				if (!include11 && !include21) {
					if (D1 > C)
						newPoints.push([P1[0],P1[1],D1]);
					else
						lockedPoints.push([P1[0],P1[1]]);
				}
				if (!include12 && !include22) {
					if (D2 > C)
						newPoints.push([P2[0],P2[1],D2]);
					else
						lockedPoints.push([P2[0],P2[1]]);
				}
				if (!include13 && !include23) {
					if (D3 > C)
						newPoints.push([P3[0],P3[1],D3]);
					else
						lockedPoints.push([P3[0],P3[1]]);
				}
				if (!include14 && !include24) {
					if (D4 > C)
						newPoints.push([P4[0],P4[1],D4]);
					else
						lockedPoints.push([P4[0],P4[1]]);
				}
			}
			// console.log(newPoints);
			// console.log(newPoints.length);
			if (newPoints.length < 1) break;
			if (newPoints.length > 10000) break;

			pastPoints = [];
			for (let i = 0; i < activePoints.length; i++) {
				pastPoints.push([activePoints[i][0],activePoints[i][1],activePoints[i][2]]);
			}

			activePoints = [];
			for (let i = 0; i < newPoints.length; i++) {
				activePoints.push([newPoints[i][0],newPoints[i][1],newPoints[i][2]]);
			}
			iter++;
		}
		return lockedPoints;
	}
	DistanceToTree0(target) {
		let distance = 0;
		this.MakeByTree((p, j) => {
			let v = distanceToLine(target, p.position, j.position);
			distance += 20 / Math.pow(Math.abs(v), 4);
		}, (p) => { });
		return distance;
	}
	DistanceToTree(target) {
		let distance = 0;
		let Ldistance = 0;
		let Udistance = 0;
		this.MakeByTree((p, j) => {
			let v = distanceToLine(target, p.position, j.position);
			distance += 20 / Math.pow(Math.abs(v), 1);

			let v1 = distanceToLine([target[0] + 0.01, target[1]], p.position, j.position);
			Ldistance += 20 / Math.pow(Math.abs(v1), 1);

			let v2 = distanceToLine([target[0], target[1] + 0.01], p.position, j.position);
			Udistance += 20 / Math.pow(Math.abs(v2), 1);
		}, (p) => { });
		return [distance, Ldistance, Udistance];
	}
}

function randomIn(min, max) {
	return min+Math.random()*(max-min);
}

var P = [];
// let StartPoint = [50+Math.random()*(canv.width-100),50+Math.random()*(canv.height-100)];
// P.push(new Point(P.length, StartPoint));
// for (let i = 0; i < 3; i++) {
// 	let a = Math.random()*2*Math.PI;
// 	let l = randomIn(50,90);
// 	P.push(new Point(P.length,[StartPoint[0]+Math.cos(a)*l, StartPoint[1]+Math.sin(a)*l]));

// 	P[0].joints.push(P[P.length-1]);
// 	P[P.length-1].joints.push(P[0]);
// }

var T = new Tree(P);

for (let y = 0; y < canv.height; y += canv.height / 10) {
	for (let x = 0; x < canv.width; x += canv.width / 10) {
		// console.log(T.DistanceToTree([x, y]));
		// d.circle(x, y, T.DistanceToTree([x, y]), "white", "white");
		// d.ray();
	}
}


let selectedPoint = -1;
document.addEventListener("mousedown", (e)=>{
	if (T.points.length == 0) {
		T.points.push(new Point(0,[e.offsetX,e.offsetY]));
	}
	if (e.button == 0 && selectedPoint != -1) {
		let isOnPoint = false;
		let nextPointSelected = -1;
		for (let i = 0; i < T.points.length; i++) {
			let delta = [e.offsetX-T.points[i].position[0],e.offsetY-T.points[i].position[1]];
			if (math.magnitude(delta) < 8) {
				isOnPoint = true;
				nextPointSelected = i;
				break;
			}
		}
		if (isOnPoint) {
			let isIncl = false;
			let inclInd = -1;
			for (let i = 0; i < T.points[nextPointSelected].joints.length; i++) {
				if (T.points[nextPointSelected].joints[i] == T.points[selectedPoint]) {
					isIncl= true;
					inclInl=i;
					break;
				}
			}
			if (isIncl) {

			} else {
				T.points[nextPointSelected].joints.push(T.points[selectedPoint]);
				T.points[selectedPoint].joints.push(T.points[nextPointSelected]);
				selectedPoint = nextPointSelected;
			}
			// console.log(nextPointSelected);
			// console.log(selectedPoint);
		} else {
			let newPoint = new Point(T.points.length, [e.offsetX,e.offsetY]);

			newPoint.joints = [T.points[selectedPoint]];
			T.points[selectedPoint].joints.push(newPoint);
			
			T.points.push(newPoint);

			selectedPoint = T.points.length-1;
		}
	}
	if (e.button == 0 && selectedPoint == -1) {
		for (let i = 0; i < T.points.length; i++) {
			let delta = [e.offsetX-T.points[i].position[0],e.offsetY-T.points[i].position[1]];
			if (math.magnitude(delta) < 8) {
				selectedPoint = i;
				break;
			}
		}
	}
	// console.log(e.button);
	if (e.button == 2) {
		selectedPoint = -1;
	}
});

console.log("lockedPs = T.DrawVolume(0.01,2)");

let Q = 40;
function render() {
	deltaTime = (new Date() - startTime);
	startTime = new Date();
	fps += 1000 / deltaTime;
	if (frame % frameCountForSample == 0) {
		rFps = fps / frameCountForSample;
		fps = 0;
	}

	d.clear("black");

	for (let y = 0; y < canv.height; y += canv.height / Q) {
		for (let x = 0; x < canv.width; x += canv.width / Q) {

			let v = T.DistanceToTree([x, y]);
			let D = [v[1] - v[0], v[2] - v[0]];
			let R = Math.min(math.magnitude(D) * 100000, canv.width / Q / 1.5);
			// d.rect(x, y, canv.width / Q, canv.height / Q, inRgb(v[0] * Q, 0, 255 - v[0] * Q), "white");
			// d.circle(x, y, Math.min(v[0] * 5, canv.width / Q / 2), "white", "white");
			// d.ray(x, y, { x: D[0], y: D[1] }, R, "red");
			d.ray(x, y, { x: -D[1], y: D[0] }, R, "rgba(230,10,10,0.7)");
		}
	}
	T.Draw();
	for (let i = 0; i < lockedPs.length; i++) {
		d.rect(lockedPs[i][0], lockedPs[i][1], 2,2, "White", "White");
	}
	d.txt(Math.round(rFps), 1, 16, "", "white");
	frame++;
	requestAnimationFrame(render);
};
requestAnimationFrame(render);