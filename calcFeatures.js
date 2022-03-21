/**
 * Calculate features for the given token data.
 * @param {Object} tokenData
 * @param {string} tokenData.tokenId - Unique identifier of the token on its contract.
 * @param {string} tokenData.hash - Unique hash generated upon minting the token.
 */
 function calculateFeatures(tokenData) {
  /**
   * Implement me. This function should return a set of features in the format of key-value pair notation.
   *
   * For example, this should return `{"Palette": "Rosy", "Scale": "Big", "Tilt": 72}` if the desired features for a mint were:
   * - Palette: Rosy
   * - Scale: Big
   * - Tilt: 72
   */
  
  // indexes for stepping through the hash
  let nextDimIdx = 0;
  let dimIdxDirection = 'incr';

  // hashObject contains multiple ways to slice and dice token.hash
  const hashObject = {};
  const attributes = {};
  const featureObj = {};

  // linear interpolator (integer)
  const lerpInteger = (start, end) => {
    const frac = hashObject.fracArray[chooseNextIdx()];
    return Math.floor((1 - frac) * start + frac * (end + 1));
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
    attributes.numberOfBubbles = lerpInteger(5, 9);
    
    // floor rotation period (0 means no rotation)
    const floorIdx = lerpInteger(0, 3);
    attributes.floorRotPeriod = floorIdx * 15;
    featureObj['floor rotation speed'] = ['none', 'fast', 'medium', 'slow'][floorIdx];

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
    featureObj['shapes'] = bubbleTypes.length === 1 ?
      bubbleTypes[0] + 's only' :
      bubbleTypes.join('s & ') + 's';

    // background base color (dark end of gradient)
    attributes.bgBaseColor = LightenDarkenColor(getNextColor(), -100);
    const bgColor = LightenDarkenColor(attributes.bgBaseColor, 50);
    attributes.bgLightColor = bgColor;
    const colorLevels = [];
    for (let i = 1; i < 6; i += 2) {
      const level = parseInt(bgColor.slice(i, i + 2), 16);
      if (level > 154) {
        colorLevels.push('H');
      } else if (level < 102) {
        colorLevels.push('L');
      } else {
        colorLevels.push('M');
      }
    }
    featureObj['background color levels'] =
      'red:' + colorLevels[0] + ', green:' + colorLevels[1] + ', blue:' + colorLevels[2];

    // 1 in 5 chance of bubbles continuing to spin after 10 sec
    attributes.spinPause = lerpInteger(1, 5) < 5;
    featureObj['bubble spin'] = attributes.spinPause ? 'stops' : 'continues';

    featureObj['final state'] = attributes.spinPause && floorIdx === 0 ? 'static' : 'dynamic';

    console.log(attributes);
    console.log(featureObj);
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

  const create = (hash) => {
    processHash(hash);
    defineAttributes();
  };

  create(tokenData.hash);
  return featureObj;
}
