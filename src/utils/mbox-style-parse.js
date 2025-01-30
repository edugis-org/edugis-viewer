import tinycolor from "../../lib/tinycolor.js";

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */

class MBStyleParser
{
  interpolate(type, zoom, bottom, top) {
    const bottomzoom = bottom[0];
    const bottomvalue = bottom[1];
    const topzoom = top[0];
    const topvalue = top[1];
    if (typeof bottomzoom !== 'number' || typeof bottomvalue !== 'number' || typeof topzoom !== 'number' || typeof topvalue !== 'number') {
      return 10;
    }
    if (topzoom <= bottomzoom) {
      return 10;
    }
    let result = bottomvalue;
    switch(type[0]) {
      case 'linear':
        result = bottomvalue + ((zoom - bottomzoom)/(topzoom - bottomzoom)) * (topvalue - bottomvalue)
        break;
      case 'exponential':
        result = bottomvalue + (topvalue - bottomvalue) * (Math.pow(type[1], zoom - bottomzoom))/(Math.pow(type[1], topzoom - bottomzoom));
        break;
      case 'cubic-bezier':
        // TBI
        break;
      default:
        console.warn(`unknown interpolation: ${type[0]}`);
    }
    return result;
  }
  getZoomDependentValue(zoom, value) {
    let result = value;
    if (Array.isArray(value) && value.length > 4 && value[0] === "interpolate" && Array.isArray(value[2]) && value[2][0] === "zoom") {
      for (let i = 3; i < value.length - 1; i+=2) {
        result = value[i+1];
        if (zoom <= value[i]) {
          if (i > 3) {
            result = this.interpolate(value[1], zoom, [value[i - 2], value[i - 1]], [value[i], value[i+1]]);
          }
          break;
        } 
      }
      if (result > 30) {
        result = 30; // limit legend to 30px circle size
      }
    } else if (value === Object(value)) {
      if (value.stops && !value.hasOwnProperty('property')) {
        for (let i = 0; i < value.stops.length; i++) {
          result = value.stops[i][1];
          if (zoom < value.stops[i][0]) {
            break;
          } 
        }
      }
    }
    return result;
  }
  getPropertyInfo(paintProperty, defaultLabel) {
    if (!defaultLabel) {
      defaultLabel = '';
    }
    const result = {propertyname: "", items: []};
    if (Array.isArray(paintProperty) && paintProperty.length) {
      switch(paintProperty[0]) {
        case "step":
          // element[1] is ["get", "propertyname"] (?)
          result.propertyname = paintProperty[1][1];
          result.items.push({fillColor: paintProperty[2], outlineColor: outlineColor, label: `< ${paintProperty[3]}`});
          for (let i = 3; i < paintProperty.length - 2; i+=2) {
            // get color
            result.items.push({fillColor: paintProperty[i+1], outlineColor: outlineColor, label: `[${paintProperty[i]} - ${paintProperty[i+2]})`});
          }
          result.items.push({fillColor: paintProperty[paintProperty.length - 1], outlineColor, label: `> ${paintProperty[paintProperty.length - 2]}`})
          break;
        case "match":
          // element[1] is ["get", "propertyname"] (?)
          result.propertyname = this.getLayerStylePropertyName(paintProperty);
          result.items.push({value: paintProperty[paintProperty.length - 1], label: ''});
          for (let i = 2; i < paintProperty.length - 1; i+=2) {
            result.items.push({value: paintProperty[i+1], label: `${paintProperty[i]}`});
          }
          break;
        case "case":
            result.propertyname = this.getLayerStylePropertyName(paintProperty);
            result.items.push({value: paintProperty[paintProperty.length - 1], label: ''});
            for (let i = 1; i < paintProperty.length - 1; i+=2) {
              result.items.push({value: paintProperty[i+1], label: `${this.getLabelFromExpression(paintProperty[i])}`});
            }
        break;
      }
    } else if (paintProperty === Object(paintProperty)) {
      if (paintProperty.hasOwnProperty('property')) {
        result.propertyname = paintProperty.property;
        if (paintProperty.stops) {
          result.items = paintProperty.stops.map(stop=>{return {value:stop[1], label: stop[0]}});
        }
      }
    } else {
      result.propertyname = '';
      result.items.push({value: paintProperty, label: defaultLabel});
    }
    return result;
  }
  getZoomDependentPropertyInfo(zoom, property, defaultLabel) {
    return this.getPropertyInfo(this.getZoomDependentValue(zoom, property), defaultLabel);
  }
  colorToHex(propertyValue) {
    if (typeof propertyValue !== "string") {
      return propertyValue;
    }
    const color = tinycolor(propertyValue);
    return color.toHexString();
  }
  searchPaintForProperty(paint) {
    if (Array.isArray(paint)) {
      if (paint.length === 2 && paint[0] === "get") {
        return paint[1];
      }
      return paint.reduce((result, item)=>{
        if (!result) {
          let search = this.searchPaintForProperty(item);
          if (search) {
            result = search;
          }
        }
        return result;
      }, false);
    }
    return false;
  }
  getLabelFromExpression(expression) {
    if (typeof expression === "string") {
      return expression;
    }
    let label = '';
    if (Array.isArray(expression)) {
      if (expression.length == 3) {
        if (typeof expression[2] === "string" || typeof expression[2] === "number" || typeof expression[2] === "boolean") {
          label = expression[2]
        } else if (typeof expression[1] === "string" || typeof expression[1] === "number" || typeof expression[1] === "boolean") {
          label = expression[1];
        }
        if (typeof expression[0] === "string" && expression[0] !== "==") {
          label = expression[0] + ' ' + label;
        }
      }
    }
    return label;
  }
  getLayerStylePropertyName(paint) {
      if (paint.property) {
        return paint.property;
      }
      if (Array.isArray(paint)) {
        if (paint[0] === "step" || paint[0] === "match") {
          if (paint[1][0] === "get") {
            return paint[1][1];
          }
        }
        if (paint[0] === "case") {
          let condition = paint[1];
          for (let item of condition) {
            if (item.length === 2 && item[0] === "get") {
              return item[1];
            }
          }
        }
        let search = this.searchPaintForProperty(paint);
        if (search) {
          return search;
        }
      }
      return undefined;
  }
  styleArrayToItems(styleArray, paintPropertyName)
  {
    // convert mapbox paint style array to legend with items
    let result;
    if (Array.isArray(styleArray) && styleArray.length) {
      let attributeName = this.getLayerStylePropertyName(styleArray);
      switch (styleArray[0]) {
        case "step":
          {
            // element[1] is ["get", "propertyname"]
            result = {legendTitle: attributeName, items: [], type: "seq", attribute: attributeName};
            if (typeof styleArray[3] === "string") {
              result.type = "qual"
            }
            const paintProperties = {};
            paintProperties[paintPropertyName] = this.colorToHex(styleArray[2]);
            result.items.push({paint: paintProperties, label: typeof styleArray[3] === "string" ? styleArray[3] : '< ' + styleArray[3]});
            for (let i = 3; i < styleArray.length - 2; i +=2) {
              const newProperty = {}
              newProperty[paintPropertyName] = this.colorToHex(styleArray[i+1]);
              result.items.push({paint: newProperty, label: styleArray[i] + " - " + styleArray[i+2]});
            }
            const lastProperty = {}
            lastProperty[paintPropertyName] = this.colorToHex(styleArray[styleArray.length - 1]);
            result.items.push({paint: lastProperty, label: typeof styleArray[styleArray.length - 2] === "string" ? styleArray[styleArray.length - 2] : "> " + styleArray[styleArray.length - 2]})
          }
          break;
        case "match":
        case "case":
          {
            // element[1] is ["get", "propertyname"] (?)
            result = {legendTitle: attributeName, items: [], type: "seq", attribute: attributeName};
            if (typeof styleArray[2] === "string") {
              result.type = "qual";
            }
            const defaultProperty = {}
            defaultProperty[paintPropertyName] = this.colorToHex(styleArray[styleArray.length - 1]);
            result.items.push({paint: defaultProperty, label: ''});
              
            for (let i = 2; i < styleArray.length - 1; i += 2) {
              const newProperty = {};
              newProperty[paintPropertyName] = this.colorToHex(styleArray[i + 1]);
              result.items.push({
                paint: newProperty,
                label: styleArray[i]
              });
            }
          }
          break;
      }
    }
    return result;
  }
  styleObjectToItems(styleObject, paintPropertyName) {
    // convert mapbox paint style object to legend with items
    let result;
    if (styleObject === Object(styleObject)) {
      if (styleObject.hasOwnProperty('property')) {
        result = {legendTitle: styleObject.property, items: [], type: "seq", attribute: styleObject.property};
        if (typeof styleObject.stops[0][0] === "string") {
          result.type = "qual";
        }
        result.propertyname = styleObject.property;
        if (styleObject.stops) {
          result.items = styleObject.stops.map(stop=>{
            const paint = {}
            paint[paintPropertyName] = this.colorToHex(stop[1]);
            return {paint: paint, label: stop[0]}});
        }
      }
    }
    return result;
  }
  styleStringToItems(styleString, paintPropertyName, layerTitle) {
    let result;
    if (typeof styleString === "string") {
      let paint = {};
      paint[paintPropertyName] = this.colorToHex(styleString);
      result = {legendTitle: layerTitle, items:[{paint: paint, label: layerTitle}], attribute: layerTitle}
    }
    return result;
  }
  paintStyleToLegendItems(paintStyle, legendType, zoom, layerTitle)
  {
    // convert mapbox paint style to legend lines
    // return {legendTitle: title, legendType: "line|fill|circle", legendItems: [{paintProperties:{}, label}]}
    if (!layerTitle) {
      layerTitle = "";
    }
    let result = {legendTitle: layerTitle, legendType: legendType, items: [], classType: 'unknown', classCount: 0};

    let propertyname = `${legendType}-color`;

    let legend = this.styleArrayToItems(paintStyle, propertyname);
    if (!legend) {
      // object ?
      legend = this.styleObjectToItems(paintStyle, propertyname);
    }
    if (!legend) {
      // string?
      legend = this.styleStringToItems(paintStyle, propertyname, layerTitle);
    }
    if (legend) {
      legend.itemCount = legend.items.length;
      legend.classType = undefined;
      legend.items = legend.items.map(item=>{
        item.from = undefined;
        item.to = undefined;
        return item;
      })
      result = legend;
    }
    return result;
  }

  _parseBooleanCast(expression) {
    const fallback = expression[expression.length - 1];
    let attrName = '';
    if (expression.length > 0 && expression[1].length === 2 && expression[1][0] === 'feature-state') {
      attrName = 'feature-state';
    }
    return[{attrName: attrName, attrExpression: '', attrValue: fallback}];
  }

  _parseBooleanExpression(expression) {
    let attrExpression = expression[0];
    switch (attrExpression) {
      case '!':
        const not = this._parseBooleanExpression(expression[1])[0];
        return [{attrName: not.attrName, attrExpression: ["!",not.attrExpression], attrValue: not.paintValue}];
      case 'has':
        return [{attrName: this._parsePaintProperty(expression[1])[0].paintValue, attrExpression: attrExpression}]
      case '<':
      case '>':
      case '>=':
      case '<=':
      case '!=':
      case '==':
        const left = this._parsePaintProperty(expression[1])[0];
        const right = this._parsePaintProperty(expression[2])[0];
        const attrName = left.attrName !== undefined ? left.attrName : right.attrName;
        if (left.attrName === undefined && ['<','>'].some(operator=>attrExpression.includes(operator))) {
          attrExpression = attrExpression.replace('<','@').replace('>', '<').replace('@','>');
        }
        const attrValue = left.hasOwnProperty('paintValue') ? left.paintValue : right.paintValue;
        return [{attrName: attrName, attrExpression: attrExpression, attrValue: attrValue}];
      case 'any':
      case 'all':
        const bools = expression.slice(1).map(expr=>this._parseBooleanExpression(expr)[0]);
        const attrNames = bools.map((item)=>item.attrName);
        const attrExpressions = [attrExpression, ...bools.map(({attrExpression})=>attrExpression)];
        const attrValues = bools.map(({attrValue})=>attrValue);
        return [{attrName: attrNames, attrExpression: attrExpressions, attrValue: attrValues}];
      case 'in':
        return this._parseInExpression(expression);
      case 'boolean':
        return this._parseBooleanCast(expression);
      default:
        console.warn(`unhandled boolean case "${attrExpression}"`);
    }
  }
  _parseCaseExpression(expression, type, zoom, attrName, layout) {
    /*
    Selects the first output whose corresponding test condition evaluates to true, or the fallback value otherwise.
    Syntax:
    ["case",
        condition: boolean, output: OutputType,
        condition: boolean, output: OutputType,
        ...,
        fallback: OutputType
    ]: OutputType 
    */
    if (expression.length < 4 || expression.length % 2 == 1) {
      console.warn('case expression: expected odd number of parameters and number of parameters > 2');
      return []
    }
    const result = []
    for (let i = 1; i < expression.length - 1; i += 2) {
      const caseitem = this._parseBooleanExpression(expression[i])[0];
      caseitem.paintValue = this._parsePaintProperty(expression[i+1])[0].paintValue;
      if (caseitem.attrName !== 'feature-state') {
        result.push(caseitem);
      }
    }
    result.push(this._parsePaintProperty(expression[expression.length -1])[0]);
    return result;
  }
  _parseMatchExpression(expression, type, zoom, attrName, layout) {
    /* 
    Selects the output for which the label value matches the input value, or the fallback value if no match is found. The input can be any 
    expression (for example, ["get", "building_type"]). Each label must be unique, and must be either:
    * a single literal value; or
    * an array of literal values, the values of which must be all strings or all numbers (for example [100, 101] or ["c", "b"]).
    The input matches if any of the values in the array matches using strict equality, similar to the "in" operator. 
    If the input type does not match the type of the labels, the result will be the fallback value.
    Syntax
    ["match",
        input: InputType (number or string),
        label: InputType | [InputType, InputType, ...], output: OutputType,
        label: InputType | [InputType, InputType, ...], output: OutputType,
        ...,
        fallback: OutputType
    ]: OutputType
    */
    if (expression.length < 5 || expression.length % 2 !== 1) {
      console.warn('match expression: expected even number of parameters and number of parameters > 3');
      return []
    }
    const result = [];
    const attrExpression = "==";
    attrName = this._parsePaintProperty(expression[1])[0].attrName;
    for (let i = 2; i < expression.length - 1; i += 2) {
      const attrValue = this._parsePaintProperty(expression[i])[0].paintValue;
      const paintValue = this._parsePaintProperty(expression[i+1])[0].paintValue;
      result.push({attrName: attrName, attrExpression: attrExpression, attrValue: attrValue, paintValue: paintValue});
    }
    result.push(this._parsePaintProperty(expression[expression.length -1])[0]);
    return result;
  }
  _parseInterpolateExpression(expression, type, zoom, attrName, layout) {
    /*
    Produces continuous, smooth results by interpolating between pairs of input and output values ("stops"). The input may be any numeric expression (e.g., ["get", "population"]). 
    Stop inputs must be numeric literals in strictly ascending order. The output type must be number, array<number>, or color.
    Interpolation types:
    ["linear"]: Interpolates linearly between the pair of stops just less than and just greater than the input.
    ["exponential", base]: Interpolates exponentially between the stops just less than and just greater than the input. base controls the rate at which the output increases: higher values make the output increase more towards the high end of the range. With values close to 1 the output increases linearly.
    ["cubic-bezier", x1, y1, x2, y2]: Interpolates using the cubic bezier curve defined by the given control points.
    Syntax
    ["interpolate",
        interpolation: ["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2],
        input: number,
        stop_input_1: number, stop_output_1: OutputType,
        stop_input_n: number, stop_output_n: OutputType, ...
    ]: OutputType (number, array<number>, or Color)
    */
    if (expression.length > 4 && Array.isArray(expression[2])) {
        const input=this._parsePaintProperty(expression[2], type, zoom, attrName, layout)[0];
        attrName = input.attrName;
        const attrValue = input.attrValue;
        const attrExpression = `${expression[0]},${expression[1][0]}`
        let base = expression[1][0] === 'linear' ? 1 : expression[1][0] == 'exponential' ? expression[1][1]: null; // cubic bezier tbi
        let paintValue = this._parsePaintProperty(expression[4])[0].paintValue;
        if (attrName === 'zoom') {
          const propertyName = this.searchPaintForProperty(expression);
          if (propertyName) {
            attrName = attrName ? `${attrName},${propertyName}`: propertyName;
          }
          for (let i = 3; i < expression.length - 1; i+=2) {
            if (zoom <= this._parsePaintProperty(expression[i])[0].paintValue) {
              if (i > 3) {
                paintValue = this._interpolate(zoom, expression[i-2],expression[i],expression[i-1],this._parsePaintProperty(expression[i+1])[0].paintValue, base);
              }
              break;
            }
          }
          return [{attrName: attrName, attrExpression: attrExpression, attrValue: attrValue, paintValue: paintValue}]
        } else {
          const result = []
          for (let i = 3; i < expression.length - 1; i+=2) {
            result.push({attrName:attrName, attrValue: this._parsePaintProperty(expression[i])[0].paintValue, attrExpression: attrExpression, paintValue: this._parsePaintProperty(expression[i+1])[0].paintValue});
          }
          return result;
        }
    }
    console.warn(`unexpected or incorrect? interpolate expression ${JSON.stringify(expression)}`)
    return [];
  }
  _parseInterpolateColorSchemeExpression(expression, type, zoom, attrName, layout, colorScheme) {
    let interpolationType = expression[1][0];
    const base = interpolationType === 'linear' ? 1 : interpolationType === 'exponential' ? expression[1][1] : null;
    const input = this._parsePaintProperty(expression[2])[0];
    let stops = expression.slice(3);
    const result = []
    for (let i = 0; i < stops.length; i+=2) {
     result.push({attrName: input.attrName, attrValue: stops[i], attrExpression: `interpolate-${colorScheme},${interpolationType},${base}`, paintValue: stops[i+1]});
    }
    return result;
  }
  _parseInterpolateLabExpression(expression, type, zoom, attrName, layout) {
    /*
    Produces continuous, smooth results by interpolating between pairs of input and output values ("stops"). Works like interpolate, but the output type must be color,
    and the interpolation is performed in the CIELAB color space.
    Syntax
    ["interpolate-lab",
        interpolation: ["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2 ],
        input: number,
        stop_input_1: number, stop_output_1: Color,
        stop_input_n: number, stop_output_n: Color, ...
    ]: Color
    */
    return this._parseInterpolateColorSchemeExpression(expression, type, zoom, attrName, layout, 'lab');
  }
  _parseInterpolateHclExpression(expression, type, zoom, attrName, layout) {
    /* 
    Produces continuous, smooth results by interpolating between pairs of input and output values ("stops"). 
    Works like interpolate, but the output type must be color, and the interpolation is performed in the 
    Hue-Chroma-Luminance color space.
    Syntax
    ["interpolate-hcl",
        interpolation: ["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2],
        input: number,
        stop_input_1: number, stop_output_1: Color,
        stop_input_n: number, stop_output_n: Color, ...
    ]: Color
    */
    return this._parseInterpolateColorSchemeExpression(expression, type, zoom, attrName, layout, 'hcl');
  }
  _parseStepExpression(expression, type, zoom, attrName, layout) {
    /* Produces discrete, stepped results by evaluating a piecewise-constant function defined by pairs of input and output values ("stops").
       The input may be any numeric expression (e.g., ["get", "population"]). Stop inputs must be numeric literals in strictly ascending order. 
       Returns the output value of the stop just less than the input, or the first output if the input is less than the first stop.
      Syntax
      ["step",
        input: number,
        stop_output_0: OutputType,
        stop_input_1: number, stop_output_1: OutputType,
        stop_input_n: number, stop_output_n: OutputType, ...
      ]: OutputType 
    */
    const result = [];
    if (expression.length > 4 && expression.length % 2 == 1) {
      const test = this._parsePaintProperty(expression[1]);
      if (!test ){
        console.warn('teeme');
      }
      const input = this._parsePaintProperty(expression[1])[0];
      let stopOutput = this._parsePaintProperty(expression[2])[0];
      for (let i = 2; i < expression.length - 1; i += 2) {
        const stopOutput = this._parsePaintProperty(expression[i])[0];
        const stopInput = this._parsePaintProperty(expression[i+1])[0];
        result.push({attrName: input.attrName, attrValue: stopInput.paintValue, attrExpression: "<", paintValue: stopOutput.paintValue});
      }
      const lastInput = this._parsePaintProperty(expression[expression.length-2])[0];
      const lastOutput = this._parsePaintProperty(expression[expression.length-1])[0];
      result.push({attrName: input.attrName, attrValue: lastInput.paintValue, attrExpression: ">=", paintValue: lastOutput.paintValue});
    }
    return result;
  }
  _parseArithmeticExpression(expression, type, zoom, attrName, layout) {
    switch (expression[0]) {
      case '+':
      case '*':
      case '%':
      case '/':
      case 'min':
      case 'max':
        const attrValues = expression.slice(1).map(subexpression=>this._parsePaintProperty(subexpression)[0]);
        return [{attrName: attrName, attrValue: attrValues, attrExpression: expression[0], paintValue: attrValues}];
      default:
        let value = this._parsePaintProperty(expression[1])[0];
        return [{attrName: attrName, attrValue: value, attrExpression: expression[0], paintValue: value}]
    }
  }
  _parseGetExpression(expression, type, zoom, attrName, layout) {
    if (expression.length == 2 && (expression[0] === "get" || expression[0] === 'var')) {
      return [{attrName: expression[1]}]
    }
    return [];
  }

  _parseInExpression(expression, type, zoom, attrName, layout) {
    /*
    Determines whether an item exists in an array or a substring exists in a string. In the specific case when the second and 
    third arguments are string literals, you must wrap at least one of them in a literal expression to hint correct 
    interpretation to the type system.
    Syntax
    ["in",
        keyword: InputType (boolean, string, or number),
        input: InputType (array or string)
    ]: boolean
    */
    const input = this._parsePaintProperty(expression[2],type,zoom,attrName,layout);
    return[{attrName: input[0].attrName, attrValue: expression[1], attrExpression: 'in'}];
  }
  _parsePaintExpression(expression, type, zoom, attrName, layout) {
    if (expression.length === 0) {
      return [];
    }
    switch (expression[0]) {
      case 'zoom':
        return [{attrName: 'zoom', attrValue: zoom, attrExpression: 'zoom'}];
      case 'literal':
        return [{attrValue: expression[1], paintValue: expression[1]}];
      case 'let':
        return this._parsePaintProperty(expression.slice(-1)[0]);
      case 'get':
      case 'var':
        return this._parseGetExpression(expression, type, zoom, attrName, layout);
      case 'case':
        return this._parseCaseExpression(expression, type, zoom, attrName, layout);
      case 'match':
        return this._parseMatchExpression(expression, type, zoom, attrName, layout);
      case 'step':
        return this._parseStepExpression(expression, type, zoom, attrName, layout);
      case 'interpolate':
        return this._parseInterpolateExpression(expression, type, zoom, attrName, layout);
      case 'interpolate-lab':
        return this._parseInterpolateLabExpression(expression, type, zoom, attrName, layout);
      case 'interpolate-hcl':
        return this._parseInterpolateHclExpression(expression, type, zoom, attrName, layout);
      case '*':
      case '+':
      case '-':
      case '%':
      case '/':
      case 'abs':
      case 'acos':
      case 'asin':
      case 'atan':
      case 'ceil':
      case 'cos':
      case 'distance':
      case 'e':
      case 'floor':
      case 'ln':
      case 'ln2':
      case 'log10':
      case 'log2':
      case 'max':
      case 'min':
      case 'pi':
      case 'round':
      case 'sin':
      case 'sqrt':
      case 'tan':
        return this._parseArithmeticExpression(expression, type, zoom, attrName, layout);
      case 'to-number':
      case 'to-string':
      case 'to-boolean':
      case 'to-color':
        return this._parsePaintProperty(expression[1], type, zoom, attrName, layout);
      default:
        console.warn(`expression "${expression[0]}" not (yet) supported`);
    }
    return [];
  }

  _interpolate(input, lowerInput, upperInput, lowerOutput, upperOutput, base)
  {
    const difference = upperInput - lowerInput;
    const progress = input - lowerInput;
    if (difference === 0 || progress === 0) {
        return lowerOutput;
    } else if (!base || base === 1) {
        return (progress / difference) * (upperOutput - lowerOutput) + lowerOutput;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1) * (upperOutput - lowerOutput) + lowerOutput;
    }
  }
  _parsePaintFunction(paintFunction, type, zoom, attrName, layout)
  {
    let result = [];
    if (!paintFunction.hasOwnProperty('property')) {
      // no input property: use zoom as input 
      const {stops,base} = paintFunction;
      if (stops) {
        for (let i = 0; i < stops.length; i++) {
          if (zoom < stops[i][0]) {
            let value = i === 0 ? stops[0][1] : typeof stops[i][1] === 'number' ? this._interpolate(zoom, stops[i-1][0],stops[i][0],stops[i-1][1],stops[i][1],base) : stops[i][1];
            return [{attrName: attrName, attrValue: zoom, paintValue: value}];
          } 
        }
        return [{attrName: attrName, attrValue: zoom, paintValue: stops[stops.length - 1][1]}];
      }
      console.warn('unimplemented: zoom function without stops');
    }
    if (paintFunction.stops) {
      result = paintFunction.stops.map(stop=>{
        return {attrName: paintFunction.property, attrValue: stop[0], paintValue: stop[1]}
      });
    } 
    return result;
  }

  _parsePaintLiteral(literal, type, attrName, layout)
  {
    const item = {attrName: attrName, paintValue:literal};
    if (type === 'text') {
      item.layout = layout;
    }
    return [item];
  }

  _propertyType(property) {
    return Array.isArray(property) ? 'expression' 
      : typeof property === "object" && property !== null && property !== undefined ? 'function' 
      : 'literal';
  }

  _parsePaintProperty(paintProperty, type, zoom, attrName, layout) {
    switch (this._propertyType(paintProperty)) {
      case 'expression':
        return this._parsePaintExpression(paintProperty, type, zoom, attrName, layout);
      case 'function':
        return this._parsePaintFunction(paintProperty, type, zoom, attrName, layout);
      case 'literal': 
        return this._parsePaintLiteral(paintProperty, type, attrName, layout);
      default:
        return [];
    }
  }

  _legendItems(layer, title, zoom, propertyName) {
    const {id, metadata, paint, layout} = layer;
    const attrName = metadata && metadata.title ? metadata.title : title ? title: id;
    const result = []
    if (paint) {
      const type = layer.type === 'symbol'? 'text' : layer.type;
      if (type === 'fill' && propertyName === 'stroke-color') {
        propertyName = 'outline-color';
      }
      if (type === 'line' && propertyName === 'stroke-width') {
        propertyName = 'width';
      }
      const paintProperty = paint[`${type}-${propertyName}`];
      if (!paintProperty && paintProperty !== 0) {
        return result;
      }
      return this._parsePaintProperty(paintProperty, type, zoom, attrName, layout)
    } else if (layout && layer.type === 'symbol' && propertyName === 'color') {
      result.push({attrName: attrName, paintValue: '#000', layout: layout})
    }
    return result;
  }

  legendItemsFromLayer(layer, title, zoom) {
    const result = {
      colorItems: this._legendItems(layer, title, zoom, 'color'),
      radiusItems: this._legendItems(layer, title, zoom, 'radius'),
      strokeColorItems: this._legendItems(layer, title, zoom, 'stroke-color'),
      strokeWidthItems: this._legendItems(layer, title, zoom, 'stroke-width'),
    }
    if (result.radiusItems.length === 1 && result.radiusItems[0].attrExpression && Array.isArray(result.radiusItems[0].paintValue)) {
      // value is likely an expression: "c * sqrt(attribute_value)"
      const expression = result.radiusItems[0];
      const attrExpression = expression.attrExpression;
      const constant = expression.paintValue[0].paintValue;
      const func = expression.paintValue[1].attrExpression;
      const attrName = expression.paintValue[1].paintValue.attrName;
      result.radiusItems = [{attrName: attrName, paintValue: 10, attrValue: Math.round(100/(constant*constant))},
                {attrName: attrName, paintValue: 20, attrValue: Math.round(400/(constant*constant))}]
    }
    return result;
  }
}



const mbStyleParser = new MBStyleParser();

export default mbStyleParser;

