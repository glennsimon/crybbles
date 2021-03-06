const container = document.createElement('div');
container.id = 'container';
const floorDatum = document.createElement('div');
floorDatum.id = 'floor-datum';
const floor = document.createElement('div');
floor.id = 'floor';
floorDatum.append(floor);
container.append(floorDatum);
document.body.append(container);

const toRad = (deg) => {
  return (2 * Math.PI * deg) / 360;
};
const toDeg = (rad) => {
  return (360 * rad) / (2 * Math.PI);
};

const windowWidth = Math.min(window.innerWidth, window.innerHeight);
const windowHeight = windowWidth;
const floorWidth = (5 * windowWidth) / 3;
const floorHeight = floorWidth;
const outerNucleusRad = floorWidth / 3;

// The following constants set the allowable range of variables
const nBubblesRange = [5, 9];
const leftPosDriftRange = [-windowWidth, windowWidth];
const bubbleSizeRange = [windowWidth / 5, windowWidth / 3];
const durationRange = [6, 15];
const spinDurationRange = [3, 10];

// indexes for stepping through the hash
let nextDimIdx = 0;
let dimIdxDirection = 'incr';

// hashObject contains multiple ways to slice and dice token.hash
const hashObject = {};
const attributes = {};
const nucleusData = [];
const bubbleEngine = [];
const visibleBubbles = [];

const style = document.createElement('style');
style.type = 'text/css';
const setBgGradient = (upperBgColor, lightening) => {
  style.innerHTML = `
* {box-sizing: border-box;position: absolute;}
body {margin: 0;padding: 0;}
#container {
position: fixed;
width: ${windowWidth}px;
height: ${windowHeight}px;
top: 50%;
left: 50%;
margin-top: -${windowWidth / 2}px;
margin-left: -${windowWidth / 2}px;
overflow: hidden;
perspective: ${attributes.perspective}px;
background: radial-gradient(circle at bottom,
${LightenDarkenColor(upperBgColor, lightening)},
${upperBgColor});
}
#floor-datum {
width: ${floorWidth}px;
height: ${floorHeight}px;
left: -${windowWidth / 3}px;
transform-style: preserve-3d;
transform: rotateX(${attributes.angle}deg);
}
#floor {
width: ${floorWidth}px;
height: ${floorHeight}px;
background: radial-gradient(circle at center,
${LightenDarkenColor(upperBgColor, lightening)}B0,
${upperBgColor}B0 70.7%, transparent 70.7%);
transform-style: preserve-3d;
animation: floor-rot ${attributes.floorRotPeriod}s linear infinite;
}`;
};

document.head.appendChild(style);

const initiateBubble = (bNum) => {
  // const floor = document.getElementById('floor');
  const translateDatum = document.createElement('div');
  translateDatum.classList.add(
    'b' + bNum + '-tran-datum',
    'bubble-tran-datum'
  );
  const growDatum = document.createElement('div');
  growDatum.classList.add('b' + bNum + '-grow-datum');
  const newElement = document.createElement('div');
  newElement.classList.add('b' + bNum + '-element');
  growDatum.append(newElement);
  translateDatum.append(growDatum);
  floor.append(translateDatum);

  switch (nucleusData[bNum].bubbleType) {
    case 'cube':
      for (let i = 1; i < 7; i++) {
        const newFace = document.createElement('div');
        newFace.classList.add(
          'b' + bNum + '-cube-face',
          'b' + bNum + '-cube-face' + i
        );
        newElement.append(newFace);
      }
      break;
    case 'tetra':
      for (let i = 1; i < 5; i++) {
        const newFace = document.createElement('div');
        newFace.classList.add(
          'b' + bNum + '-tet-face',
          'b' + bNum + '-tet-face' + i
        );
        newElement.append(newFace);
      }
      break;
    case 'dodec':
      for (let i = 1; i < 13; i++) {
        const newFace = document.createElement('div');
        newFace.classList.add(
          'b' + bNum + '-dod-face',
          'b' + bNum + '-dod-face' + i.toString(16).toUpperCase()
        );
        newElement.append(newFace);
      }
      break;
  }
};

// variables for repetitive strings
const td = '-tran-datum';
const gd = '-grow-datum';
const el = '-element';
const cf = '-cube-face';
const tf = '-tet-face';
const df = '-dod-face';
const bgTr = 'background: radial-gradient(circle at center, transparent 0, ';

const addBubbleStyle = (
  bNum,
  size,
  leftPosDrift,
  duration,
  spinAxis,
  spinDuration,
  delay
) => {
  let side, boundingSphereRad, offset, l, r, phi;

  switch (nucleusData[bNum].bubbleType) {
    case 'cube':
      boundingSphereRad = Math.sqrt(3 * (size / 2) ** 2);
      offset = size / 2;

      style.innerHTML += `
.b${bNum+cf} {
width: ${size}px;
height: ${size}px;
left: ${boundingSphereRad - offset};
top: ${boundingSphereRad - offset};
}
.b${bNum+cf}1 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 100%);
transform: translateZ(${offset}px);
}
.b${bNum+cf}2 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 100%);
transform: rotateY(180deg) translateZ(${offset}px);
}
.b${bNum+cf}3 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 100%);
transform: rotateY(90deg) translateZ(${offset}px);
}
.b${bNum+cf}4 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 100%);
transform: rotateY(-90deg) translateZ(${offset}px);
}
.b${bNum+cf}5 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 100%);
transform: rotateX(90deg) translateZ(${offset}px);
}
.b${bNum+cf}6 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 100%);
transform: rotateX(-90deg) translateZ(${offset}px);
}`;
      break;
    case 'tetra':
      side = 1.6 * size;
      l = side / Math.sqrt(3);
      r = l / 2;
      phi = Math.asin(r / (r + l));
      let psi = Math.PI / 2 - phi;
      let z = l / Math.cos(phi);
      offset = (l + r) * Math.cos(phi) - z;
      boundingSphereRad = Math.sqrt(offset ** 2 + l ** 2);

      style.innerHTML += `
.b${bNum+tf} {
width: 100%;
height: 100%;
position: absolute;
clip-path: polygon(50% ${boundingSphereRad + l}px,
${boundingSphereRad - side / 2}px ${boundingSphereRad - r}px,
${boundingSphereRad + side / 2}px ${boundingSphereRad - r}px);
transform-origin: 50% 50%;
}
.b${bNum+tf}1 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 70%);
transform: translateZ(-${offset}px);
}
.b${bNum+tf}2 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 70%);
transform: rotateX(${toDeg(psi)}deg) translateZ(${offset}px);
}
.b${bNum+tf}3 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 70%);
transform: rotate3d(-0.5, ${Math.sqrt(3) / 2}, 0, ${toDeg(psi)}deg) translateZ(${offset}px);
}
.b${bNum+tf}4 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}70 70%);
transform: rotate3d(0.5, ${Math.sqrt(3) / 2}, 0, -${toDeg(psi)}deg) translateZ(${offset}px);
}`;
      break;
    case 'dodec':
      r = 0.42 * size; // radius of circle through the face points
      let thetaDeg = 54;
      let psiDeg = 72;
      let d = r * Math.cos(toRad(psiDeg / 2));
      let s = 2 * r * Math.sin(toRad(psiDeg / 2));
      let width = 2 * r * Math.sin(toRad(psiDeg));
      let b = s * Math.sin(toRad(180 - 2 * thetaDeg));
      let m = (width - s) / 2;
      l = m / Math.cos(toRad(thetaDeg));
      let n = l * Math.sin(toRad(thetaDeg));
      phi = Math.PI / 2 - Math.asin(n / b);
      let phiDeg = toDeg(phi);
      offset = d / Math.tan(phi / 2);
      boundingSphereRad = Math.sqrt(r ** 2 + offset ** 2);

      style.innerHTML += `
.b${bNum+df} {
width: 100%;
height: 100%;
clip-path: polygon(${boundingSphereRad}px ${boundingSphereRad - r}px,
${boundingSphereRad + width / 2}px ${boundingSphereRad - (b - d)}px,
${boundingSphereRad + s / 2}px ${boundingSphereRad + d}px,
${boundingSphereRad - s / 2}px ${boundingSphereRad + d}px,
${boundingSphereRad - width / 2}px ${boundingSphereRad - (b - d)}px);
transform-origin: 50% 50%;
}
.b${bNum+df}1 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: translateZ(${offset}px);
}
.b${bNum+df}2 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(1, 0, 0, -${phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}3 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(${Math.cos(toRad(72))}, ${Math.sin(toRad(72))}, 0, -${phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}4 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(-${Math.cos(toRad(36))}, ${Math.sin(toRad(36))}, 0, -${phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}5 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(-${Math.cos(toRad(36))}, -${Math.sin(toRad(36))}, 0, -${phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}6 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(${Math.cos(toRad(72))}, -${Math.sin(toRad(72))}, 0, -${phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}7 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(1, 0, 0, -${180 + phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}8 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(${Math.cos(toRad(72))}, ${Math.sin(toRad(72))}, 0, -${180 + phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}9 {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(-${Math.cos(toRad(36))}, ${Math.sin(toRad(36))}, 0, -${180 + phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}A {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(-${Math.cos(toRad(36))}, -${Math.sin(toRad(36))}, 0, -${180 + phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}B {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(${Math.cos(toRad(72))}, -${Math.sin(toRad(72))}, 0, -${180 + phiDeg}deg) rotateZ(36deg) translateZ(${offset}px);
}
.b${bNum+df}C {
${bgTr+LightenDarkenColor(getNextColor(), 127)}80 70%);
transform: rotate3d(1, 0, 0, 180deg) translateZ(${offset}px);
}`;
      break;
  }

  style.innerHTML += `
.b${bNum+td} {
width: ${2 * boundingSphereRad}px;
height: ${2 * boundingSphereRad}px;
left: ${nucleusData[bNum].location[0] - boundingSphereRad}px;
top: ${nucleusData[bNum].location[1] - boundingSphereRad}px;
transform-style: preserve-3d;
animation: b${bNum}-translate ${duration}s ease-in forwards;
}
.b${bNum+gd} {
width: ${2 * boundingSphereRad}px;
height: ${2 * boundingSphereRad}px;
transform-style: preserve-3d;
animation: b${bNum}-size ${duration}s linear forwards;
}
.b${bNum+el} {
width: ${2 * boundingSphereRad}px;
height: ${2 * boundingSphereRad}px;
transform-style: preserve-3d;
animation: b${bNum}-spin ${spinDuration}s linear infinite;
}`;

  style.innerHTML += `
@keyframes b${bNum}-spin { 
from { transform: rotate3d(${spinAxis[0]}, ${spinAxis[1]}, ${spinAxis[2]}, 0deg); }
to { transform: rotate3d(${spinAxis[0]}, ${spinAxis[1]}, ${spinAxis[2]}, 360deg); }
}
@keyframes floor-rot { 
to { transform: rotateZ(360deg); }
}
@keyframes b${bNum}-translate { 
to { transform: translateZ(${2 * windowHeight}px); left: ${nucleusData[bNum].location[0] + leftPosDrift}px; }
}
@keyframes b${bNum}-size { 
0% { transform: scale3d(0.1, 0.1, 0.1); }
3.3% { transform: scale3d(0.5, 0.5, 0.5); }
33.3% { transform: scale3d(1, 1, 1); }
}`;
};

// linear interpolator (integer)
const lerpInteger = (start, end) => {
  const frac = hashObject.fracArray[chooseNextIdx()];
  return Math.floor((1 - frac) * start + frac * (end + 1));
};

// linear interpolator (real) from start to (0.996 * end) in 0.004 increments
const lerpReal = (start, end) => {
  const frac = hashObject.fracArray[chooseNextIdx()] + 0.5 / 256;
  return (1 - frac) * start + frac * end;
};

const chooseNextIdx = () => {
  if (nextDimIdx === hashObject.fracArray.length - 1) {
    dimIdxDirection = 'decr';
  } else if (nextDimIdx === 0) {
    dimIdxDirection = 'incr';
  }
  return dimIdxDirection === 'incr' ? nextDimIdx++ : nextDimIdx--;
};

const defineAttributes = () => {
  // number of bubble instantiation sites
  attributes.numberOfBubbles = lerpInteger(
    nBubblesRange[0],
    nBubblesRange[1]
  );
  // floor rotation period (0 means no rotation)
  attributes.floorRotPeriod = lerpInteger(0, 3) * 15;
  // bubble types
  const numBubbleTypes = lerpInteger(1, 3);
  let bubbleTypes = ['cube', 'tetra', 'dodec'];
  if (numBubbleTypes !== 3) {
    bubbleTypes.splice(lerpInteger(-1, 1), 1);
  }
  if (numBubbleTypes === 1) {
    bubbleTypes.splice(lerpInteger(0, 1), 1);
  }
  attributes.bubbleTypes = bubbleTypes;
  // background base color (dark end of gradient)
  attributes.bgBaseColor = LightenDarkenColor(getNextColor(), -100);
  // 1 in 5 chance of bubbles continuing to spin after 10 sec
  attributes.spinPause = lerpInteger(1, 5) < 5;
  // set perspective distance in pixels
  attributes.perspective = lerpReal(0.9, 2) * windowWidth;
  // set angle of floor in degrees
  attributes.angle = lerpInteger(70, 90);

  // console.log(attributes);
};

const processHash = (hash) => {
  const hexArray = [];
  const fracArray = [];
  const localHash = hash.slice(2);

  for (let i = 0; i < 63; i++) {
    const byteValue = localHash.slice(i, i + 2);
    hexArray[i] = byteValue;
    fracArray[i] = parseInt(byteValue, 16) / 256.0; // value from 0 to 0.996
  }
  hashObject.hexArray = hexArray;
  hashObject.fracArray = fracArray;
};

const getNextColor = () => {
  let nextColor = '#';
  for (let byte = 0; byte < 3; byte++) {
    nextColor += hashObject.hexArray[chooseNextIdx()];
  }
  return nextColor;
};

// color is assumed to be of the form #hhhhhh
// amount is the decimal amount of increase of all color parts (r, g, b)
// return color is #hhhhhh format
const LightenDarkenColor = (color, amount) => {
  color = color.slice(1);
  let newColor = '#';

  while (color.length > 1) {
    let tempColor = parseInt(color.substring(0, 2), 16) + amount;
    tempColor = tempColor > 255 ? 255 : tempColor < 0 ? 0 : tempColor;
    tempColorHex = tempColor.toString(16);
    newColor +=
      tempColorHex.length === 2 ? tempColorHex : '0' + tempColorHex;
    color = color.slice(2);
  }

  return newColor;
};

const nucleation = () => {
  const numberOfBubbles = attributes.numberOfBubbles;
  const centerX = floorWidth / 2;
  const centerY = floorHeight / 2;
  const startAngle = lerpReal(toRad(-45), toRad(45));
  const angleIncr = toRad(360 / numberOfBubbles);
  let nucleusSites = [];

  for (let i = 0; i < numberOfBubbles; i++) {
    const r = lerpInteger(outerNucleusRad / 4, outerNucleusRad);
    const theta = startAngle + i * angleIncr;
    nucleusSites.push([
      centerX + r * Math.sin(theta),
      centerY + r * Math.cos(theta),
    ]);
  }

  for (let i = 0; i < numberOfBubbles; i++) {
    nucleusData[i] = {};
    nucleusData[i].bubbleType = attributes.bubbleTypes[i % attributes.bubbleTypes.length];
    nucleusData[i].location = nucleusSites[i];
  }

  // console.log('nucleusData populated.');
};

async function generateBubbles() {
  const numberOfBubbles = attributes.numberOfBubbles;
  const leftPosDrift = lerpReal(
    leftPosDriftRange[0],
    leftPosDriftRange[1]
  );

  setTimeout(pauseBubbles, 10000);

  for (let bNum = 0; bNum < numberOfBubbles; bNum++) {
    const bubbleSize = lerpInteger(
      bubbleSizeRange[0],
      bubbleSizeRange[1]
    );
    const duration = lerpInteger(durationRange[0], durationRange[1]);
    const spinAxis = [
      hashObject.fracArray[chooseNextIdx()],
      hashObject.fracArray[chooseNextIdx()],
      hashObject.fracArray[chooseNextIdx()],
    ];
    const spinDuration = lerpReal(
      spinDurationRange[0],
      spinDurationRange[1]
    );

    addBubbleStyle(
      bNum,
      bubbleSize,
      leftPosDrift,
      duration,
      spinAxis,
      spinDuration,
      duration / 10
    );

    const distBetwBubbles = lerpInteger(bubbleSize * 2, bubbleSize * 3);
    const interval =
      (duration * distBetwBubbles * 1000) /
      (1.72 * ((2 * windowHeight) / 3));

    initiateBubble(bNum);
    bubbleEngine[bNum] = setInterval(initiateBubble, interval, bNum);
    await new Promise((res) =>
      setTimeout(res, hashObject.fracArray[chooseNextIdx()] * 1500)
    );
  }
}

const checkVisibility = () => {
  const bubbles = document.getElementsByClassName('bubble-tran-datum');
  const containerBR = container.getBoundingClientRect();
  for (let i = 0; i < bubbles.length; i++) {
    const bubbleName = bubbles[i].className.split(' ')[0] + i;
    if (!visibleBubbles.includes(bubbles[i])) {
      const bubbleFaces = bubbles[i].children[0].children[0].children;
      for (let j = 0; j < bubbleFaces.length; j++) {
        const faceBR = bubbleFaces[j].getBoundingClientRect();
        const faceClientHeight = bubbleFaces[j].clientHeight;
        const bubbleBottom =
          faceBR.top + Math.min(faceBR.height, faceClientHeight);
        if (
          bubbleBottom > containerBR.top &&
          faceBR.top < containerBR.bottom
        ) {
          visibleBubbles.push(bubbles[i]);
          break;
        }
      }
    }
  }
};

const clearInvisibleBubbles = () => {
  clearInterval(visibilityCheckerID);
  const bubbles = document.getElementsByClassName('bubble-tran-datum');
  for (bubble of bubbles) {
    if (!visibleBubbles.includes(bubble)) {
      bubble.remove();
    }
  }
};

let visibilityCheckerID;
const pauseBubbles = () => {
  for (let bNum = 0; bNum < attributes.numberOfBubbles; bNum++) {
    clearInterval(bubbleEngine[bNum]);

    let elements = document.body.getElementsByClassName(
      'b' + bNum + '-tran-datum'
    );
    for (const element of elements) {
      element.style.animationPlayState = 'paused';
    }
    elements = document.body.getElementsByClassName(
      'b' + bNum + '-grow-datum'
    );
    for (const element of elements) {
      element.style.animationPlayState = 'paused';
    }
    if (attributes.spinPause) {
      elements = document.body.getElementsByClassName(
        'b' + bNum + '-element'
      );
      for (const element of elements) {
        element.style.animationPlayState = 'paused';
      }
    }
  }
  visibilityCheckerID = setInterval(checkVisibility, 1000);
  setTimeout(
    clearInvisibleBubbles,
    (attributes.floorRotPeriod + 1) * 1000
  );
};

const create = (hash) => {
  processHash(hash);
  defineAttributes();
  setBgGradient(attributes.bgBaseColor, 50);
  nucleation();
  generateBubbles();
};

create(tokenData.hash);