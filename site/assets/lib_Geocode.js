/**
 * Geocode class, a middleware between geocode generation and DGG cell algorithm.
 * @see libDgg_*.js of DGG names (Geohash, S2geometry, etc.).
 * @see https://doi.org/10.5281/zenodo.2529918
 */
'use strict';

var Geocode = {
  // CONFIGS:
  cf_name:'Geohash padrão (base32ghs)'  //  commom.
  ,cf_latLng_ZERO: 0.000001  // for precision when no level defined.
  ,cf_hash_baseAlphabetLabel: 'ghs'
  ,cf_halfDigit_0: '⬒' // top_black=0 or 1
  ,cf_halfDigit_2: '⬓' // down_black=2 or 3
  ,cf_hash_sep: '.' // standard is empty. Usual '.'
  ,cf_digSepRegex: /([^\+\-\.,;]{3})/g  // f(alphabet,cf_hash_sep) usual or any other, for clean hash.
  ,cf_isoOnlyFor32: true
  // CACHED-CONFIGS: obtained by method this.config() constructor
  ,kx_hash_baseAlphabet_case: 'lower'
  ,kx_hash_baseAlphabet: '0123456789bcdefghjkmnpqrstuvwxyz' // f(cf_hash_baseAlphabetLabel)
  ,kx_hash_base: 32 // suffix only! be not confusion with this.dggCell.base of this.dggCell.id
  ,kx_hash_baseBits:5  // factor to length fill zeros, bits/2
  ,kx_halfDigit_Detect: /[⬒-⬓]$/  // f(cf_halfDigit_0,cf_halfDigit_2)
  ,kx_halfLevel_isValid: true // indica se permitido ou não na precisão.
  ,kx_latLng_ZERO_digits: 6  // f(cf_latLng_ZERO)
  // STATES:  see cleanStates() method.

  // PLUGS:
  ,dggCell: null //  to use props and call methods of an instance of DGGcell
  // minimal DGGcell have .set() and .id.
  ,cover_rgxMcl:null

  // METHODS: set, setWithoutLevel, cloneState, etc.
}; // \obj

// MAIN METHODS:


/**
 * Main method, sets a geocode by latlong or by a geocode. Need explici level.
 * Old encode() method.
 * @param lngLat array, input [longitude,latitude], as GeoJSON point coordinates
 * @param level float, a valid non-zero multiple of 2.5, as hierarchical level of DGGcell.
 */
Geocode.set = function(lngLat, level) {
  var chkByBase = {"4":[1,0.5],"32":[5,2.5],"16":[1,0.5]}; // mod detector for [exact,halfLevel]
  var ckb = chkByBase[this.kx_hash_base]; // get level profile for this base
  if (!ckb) alert("BUG99");
  if (!lngLat || !level || !(typeof lngLat=='array' || lngLat instanceof Array) || lngLat[0]===undefined || lngLat[0]===null) {
    alert("ERROR on seting geocode");
    console.log("set lngLat, level=",typeof lngLat,lngLat, level)
    throw new Error('ER05: need all parameters');
  }
  if ( !(level % ckb[0]) ) { // ONE CELL:
    // multiples of 5 are exact
    this.center = null;
    this.dggCell.set(lngLat,level);
    var j = this.dggCell.id;
    this.level = level; // sending parameter
    this.hash_base4h = j;
    this.hash = this.hlp_base4_to_outBase(j); // prefix? falta id0
    this.polygon = this.dggCell.polygon; // copy of GeoJSON.

  } else if ( !(level % ckb[1]) ) { // UNION OF TWO CELLS:
    this.center = null;
    this.dggCell.set( lngLat, Math.ceil(level) ); // level L+1
    var len = this.dggCell.id.length; // number of base4 digits
    var int_j  = bigInt(this.dggCell.id,4).shiftRight(1); // same as id >> 1
    this.degen = {i0: int_j.shiftLeft(1)}; // degenerated j,i0 and i1.
    this.degen.i1 = this.degen.i0.next().toString(4).padStart(len,'0'), // old this.hlp_int_to_base4(this.degen.i0 + 1, len);
    this.degen.i0 = this.degen.i0.toString(4).padStart(len,'0'), // old this.hlp_int_to_base4(this.degen.i0,len);
    this.degen.int_j = int_j;
    this.level = level; // sending parameter, half level.
    //console.log("union! j,degen=",this.degen)
    this.hash = this.hlp_int_to_outBase(int_j); // prefix? falta id0 conferindo se são iguais.
    this.hash_base4h = this.hlp_base4_to_b4half(this.degen.i0);
    this.dggCell.set(this.degen.i0);  // first cell
    var cell0 = this.dggCell.polygon; // cache for GeoJSON of i0.
    this.dggCell.set(this.degen.i1);  // second cell
    this.polygon = turf.union(cell0, this.dggCell.polygon); // j=union(i0,i1)
  } else
    throw new Error('ER07: Invalid level for base32 Geocode.set(). Use multiples of 2.5.');
  this.hashRender(null,false);
  if (!this.center)
    this.center = turf.centroid(this.polygon).geometry.coordinates; //lngLat array
  return this;
}; // \func


/**
 * Wrap function for hash_isValid() and set().
 * Example: this.setByHash_whenIsValid(hash,true);
 * @return null when invalid and this (chor chain) when valid.
 */
Geocode.setByHash_whenIsValid = function(hash,setToNull=false) {
  //console.log("debug0.a - setByHash_whenIsValid state=", this.getBaseState() )
  var h = this.hlp_hash_isValid(hash,true,true);
  if (h || setToNull) this.cleanStates(); // secure
  if (h) {
    this.hash=h;
    var hash_base4h = this.hlp_outBase_to_base4h(h);
    this.level = this.hlp_tmp; // by last hlp_func().
    var cells = this.base4h_halfDigitSplit(hash_base4h);
    var center = [0,0];
    var N=0;
    for(var cell of cells) {
      var c = this.dggCell.getCenter(cell).center; // lngLat array
      center[0]+=c[0]; center[1]+=c[1]; N++;
    }
    center[0]=center[0]/N; center[1]=center[1]/N;
    return this.set(center,this.level);
  } else
    return null;
}; // \func

Geocode.setWithoutLevelByDigits = function(lngLat, digits) {
  // if (!digits) use setWithoutLevel()
  if (this.kx_hash_base!=32)
    alert("WARNING 03:\nunder construction non-base32 Geocode.setByDigits");
  var digFactor_base32= 2.5;
  return this.set(lngLat,digits*digFactor_base32);
}; // \func


// // // //
// // // // OTHER METHODS:
// // // //

Geocode.cleanStates = function() {
  //Geocode.dggCell
  //if (dggCell!==undefined) this.dggCell = new Proxy(dggCell, {});
  if (!this.dggCell) alert("ERRO2: classe dggCell indefinida.");
  else this.dggCell.clean();
  this.hash = this.hash_rendered = this.level =this.center= null;
  this.coverCell_id = this.coverCell_id0 = this.coverCell_level = null; // use
  this.coverCity_name = this.coverCity_tag = null;
} // \func

/**
 *  Returns a basic state properties.
 */
Geocode.getBaseState = function() {
  return {
    dggCell: {
      id0:this.dggCell.id0
      ,id:this.dggCell.id
      ,level:this.dggCell.level
      ,base:this.dggCell.base
    }
    ,level: this.level
    ,hash: this.hash
    ,hash_rendered: this.hash_rendered
    ,center:this.center
    ,polygon:this.polygon
  };
} // \func

/**
 *  Returns full state (but not configs, that need a getConfig method).
 */
Geocode.getState = function() {
  // usar getOwnPropertyNames para loop.
  var r = this.getBaseState();
  r.cf_name = this.cf_name;
  r.cf_latLng_ZERO = this.cf_latLng_ZERO;
  r.cf_hash_baseAlphabetLabel = this.cf_hash_baseAlphabetLabel;
  r.coverCell_id0   = this.coverCell_id0;
  r.coverCell_id    = this.coverCell_id;
  r.coverCell_level = this.coverCell_level;
  r.coverCity_name  = this.coverCity_name;
  r.coverCity_tag   = this.coverCity_tag;
  r.cf_hash_baseAlphabetLabel   = this.cf_hash_baseAlphabetLabel;
  return r;
} // \func
// full state adds Configs.

Geocode.stateRefreshByLevel = function(newLevel) {
  //if (newLevel==this.level) ...
  alert("ERROR, under construction \nGeocode.stateRefreshByLevel ")
}; // \func

/**
 *  Optional sugar to config.
 */
Geocode.config = function(name, alphabet_label, sep, halfLevel) {
  // use Geocode.BaseNamedAlphabets
  // permite reconfiguração
  // Simplified config, parameters can be empty change config by basic parameters.
  if (name) this.cf_name = name;
  else if (!this.cf_name) alert ("ERROR 001, cf_name must be configurated")
  if (alphabet_label) this.cf_hash_baseAlphabetLabel = alphabet_label;
  else if (!this.cf_hash_baseAlphabetLabel) alert ("ERROR 002\n cf_hash_baseAlphabetLabel must be configurated");
  this.cf_hash_sep = (sep===undefined)? '': sep;
  this.kx_halfLevel_isValid = (halfLevel===undefined)? false: halfLevel;

  //  Main procedures, generating cache-configs:
  this.kx_hash_baseAlphabet = this.BaseNamedAlphabets[alphabet_label];
  this.base = Geocode.kx_hash_baseAlphabet.length;
  if (this.kx_hash_baseAlphabet != this.kx_hash_baseAlphabet.toLowerCase())
    this.kx_hash_baseAlphabet_case = 'upper';
  else if (this.kx_hash_baseAlphabet != this.kx_hash_baseAlphabet.toUpperCase())
    this.kx_hash_baseAlphabet_case = 'lower';
  else this.kx_hash_baseAlphabet_case = false;

  this.cleanStates(); // for case of reconfig.
}; // \func

/**
 * An iterated procedure to set Geocode's level when it is undefined, using cf_latLng_ZERO.
 */
Geocode.setWithoutLevel = function(lngLat, maxLevel=25) {
  // revisar pois não é mais para dígitos... pegar dggCell.id.length se for o caso
    for (var level=5; level<=maxLevel; level+=2.5) { // precisa usar níveis permitidos.
        var hash = this.set(lngLat, level);
        var c = this.dggCell.center;  // lngLat
        if (Math.abs(c[1]-lngLat[1])<=this.cf_latLng_ZERO && Math.abs(c[0]-lngLat[0])<=this.cf_latLng_ZERO)
          return this.hash;
    }
    return this.hash; // last in the loop by MaxLevel.
}; // \func

/**
 * Render a hash, adding seps into it.
 * Use hash and change hash_rendered when s is empty or undefined.
 * Internal use as hashRender(null,false).
 FALTA definir se usa HalfDigit na base4!
 * @param s, input hash
 * @param startSantizing boolean, to start applying hlp_hashSantize().
 * @return hash_rendered, changing state when !s.
 */
Geocode.hashRender = function (s,startSantizing=true) {
  var changeState=false;
  if (s===undefined || !s) {s=this.hash; changeState=true;}
  if (startSantizing) s = this.hlp_hashSantize(s); // important default behaviour for external input.
  if (this.cf_hash_sep) {
    s = s.replace(Geocode.cf_digSepRegex, '$1'+this.cf_hash_sep)
  	if (s.charAt(s.length-1)==this.cf_hash_sep)
  	  s = s.substr(0, s.length-1);
  }
  if (changeState) this.hash_rendered = s;
  return s;
}; // \func




// // // //
// // // //
// Public HELPER TOOLS (stateless functions)
// functions with "hlp_" prefix: they MUST not to use neither affects Geocode.props!

Geocode.BaseNamedAlphabets = { // for Geocode.config and hlp_*convertBase.
  'js':   '0123456789abcdefghijklmnopqrstuv' // standard ISO or Javascript (ECMA-262)
  ,'ghs': '0123456789bcdefghjkmnpqrstuvwxyz' // standard Geohash (js except "ailo")
  ,'pt':  '0123456789BCDFGHJKLMNPQRSTUVWXYZ' // no frequent vowel of Portuguese (for non-silabic codes)
  ,'rfc': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' // RFC3548
}
//Geocode.BaseNamedAlphabets_case = {'ghs':'lower', 'pt':'upper', 'rfc':'upper', 'js':'lower'}
// use false for non-caseSensitive

/**
 * Sanitize hash input or hash_rendered.
 * The cleanHalfDigit parameter is only to external use.
 * @return sanitized string (without affect props)
 */
Geocode.hlp_hashSantize = function(s,removeHalfDigit) {
  if (removeHalfDigit && this.kx_halfLevel_isValid && this.base==4) {
    if (removeHalfDigit===2) // truncates the hash, from level L+1/2 to L.
      s = s.replace(this.kx_halfDigit_Detect,'');
    else if (removeHalfDigit===true || removeHalfDigit===1) // emulates hash of level L+1
      s=s.replace(this.cf_halfDigit_0,'0').replace(this.cf_halfDigit_2,'2');
  }
  return s.replace(/[\.\-:;,]+/g,''); // preserves "+" of plusCodes
}; // \func

Geocode.hlp_outBase_check = function (x) {
  // !Merge with hlp_hash_isValid()!?
  if (typeof x != 'string')
    throw new Error('ER10: expecting x as string.');
  x = x.trim();
  if (!x) throw new Error('ER11: expecting non-empty x.');
  return x;
}

// hlp_baseX_to_baseY convertions:

/**
 * Converts base4 number (string) into outBase (string).
 * The outBase is expressed in the alphabet indicated by this.cf_hash_baseAlphabetLabel,
 * and its length proportional to this.level, padding zeros.
 * @param x string, input
 */
Geocode.hlp_base4_to_outBase = function(x) {
  if (!x || typeof x != 'string') throw new Error('ER15: Base4 MUST be string and non-empty');
  var outBase_len = x.length*2/this.kx_hash_baseBits;
  return bigInt(x,4,'0123',true)
        .toString(this.kx_hash_base,this.kx_hash_baseAlphabet)
        .padStart(outBase_len,'0');
};

Geocode.hlp_base4h_to_outBase = function(xB4h,xB4h_level) {
  var good=String(xB4h).trim().match(/^([0-3]+)([⬒-⬓])?$/u); // utf8 must be a range.
	if (!good)
    throw new Error('ER16: Base4h MUST be string and non-empty');
	var lastHalfDigit = good[2]? good[2]: '';
	var lastBit=''; // will be '', '0' or '1'.
  if (lastHalfDigit) lastBit = (lastBit=='⬒')? '0': '1';
	var xB4 = good[1];
  if (lastHalfDigit) {
    var x_bin =  bigInt(xB4,4,'0123').toString(2)+lastBit;
    return bigInt(x_bin,2).toString(this.kx_hash_base, this.kx_hash_baseAlphabet)
          .padStart(xB4h_level*0.4,'0');
  } else
    return bigInt(xB4,4,'0123',true)
          .toString(this.kx_hash_base, this.kx_hash_baseAlphabet)
          .padStart(xB4h_level*0.4,'0'); // usar kx* para 2/5, etc.
};

Geocode.hlp_base4_to_b4half = function(x) {
  // lost the last bit changing base4Digit to halfDigit.
  x = String(x).replace(/[01]$/,this.cf_halfDigit_0).replace(/[23]$/,this.cf_halfDigit_2);
  return x;
};

/**
 * Converts outBase number (string) into base4 (string).
 * The outBase is expressed in the alphabet indicated by this.cf_hash_baseAlphabetLabel,
 * and its length proportional to this.level, padding zeros.
 OPS, gerar fração da base4 requer mais um bit!
 * @param x string, input
 */
Geocode.hlp_outBase_to_base4h = function (x) {
  //console.log("debug10.1: hlp_outBase_to_base4h x=",x )
  x = this.hlp_outBase_check(x);
  this.hlp_tmp = x.length*this.kx_hash_baseBits/2; // base4h_len=level
  if (this.base==4)
    return x;
  var r = bigInt(x,this.kx_hash_base,this.kx_hash_baseAlphabet,true);
  if (Number.isInteger(this.hlp_tmp))
    return r.toString(4).padStart(this.hlp_tmp,'0');
  else {
    // ugly, use bitwise!
    var r_bin = r.toString(2).padStart(this.hlp_tmp*2,'0')+"0"; // add 1 bit
    r = bigInt(r_bin,2).toString(4).padStart(this.hlp_tmp+1,'0');
    r = this.hlp_base4_to_b4half( r );  // removes 1 bit
    return r;
  }
};

Geocode.base4h_halfDigitSplit = function(x) {
  x=String(x);
  if (x===undefined || x===null) alert("BUG1 EM base4h_halfDigitSplit()")
  if (!x.match(this.kx_halfDigit_Detect))
    return [x];
  var exoticDigits = {};
  exoticDigits[this.cf_halfDigit_0] = [0,1];
  exoticDigits[this.cf_halfDigit_2] = [2,3];
  var hashLastDigit = x.slice(-1);
  var hashMain = x.slice(0,-1);
  var parts=[];
  for(var i=0;i<2;i++)
    parts[i] = hashMain + exoticDigits[hashLastDigit][i];
  return parts;
}; // \func

// hlp_int_to_* convertions:

/**
 * Converts integer number (internal binary) into base32 (string representation).
 * The base32 is expressed in the alphabet indicated by this.cf_hash_baseAlphabetLabel.
 * @param x Number or bigInt, input
 * @param usePad boolean (dft true), for padding zeros by this.level
 */
Geocode.hlp_int_to_outBase = function (x,usePad=true) {
  if (typeof x =='number')
    x = bigInt(x);
  else if (typeof x != 'object') //  bigInt object
    throw new Error('ER18: expecting bigingt or integer parameter, supplied '+(typeof x));
  var outBase_len = this.level*2.0/this.kx_hash_baseBits; // supposing, not use padStart
  x = x.toString(this.kx_hash_base,this.kx_hash_baseAlphabet);
  return usePad? x.padStart(outBase_len,'0'): x;
}

/**
 * Converts integer number (internal binary) into base4 (string representation).
 * The inverse function is Javascript parseInt(x,4).
 * @param x integer, input
 * @param len number, requested length (integer or float), padding zeros.
 */
Geocode.hlp_int_to_base4 = function (x,len) {
  // for notInt len, see hlp_outBase_to_base4h()
  if (typeof x =='number')
    x = bigInt(x);
  else if (typeof x != 'object') //  bigInt object
    throw new Error('ER20: expecting bigint or int parameter of int_to_base4, but supplied '+(typeof x));
  return x.toString(4).padStart(len,'0');
}; // \func

///

/**
 * Converts base4h (with halfBigit) to binary, returning information about original level.
 */
Geocode.hlp_base4h_to_bin = function (xB4h) {
  // future kx_regex must use kx_halfDigit_Detect
	var good=xB4h.match(/^([0-3]+)([⬒-⬓])?$/u); // utf8 must be a range.
	if (!good)
		return null;
	var lastHalfDigit = good[2]? good[2]: '';
	var lastBit=''; // will be '', '0' or '1'.
  if (lastHalfDigit) lastBit = (lastBit=='⬒')? '0': '1';
	var xB4 = good[1];
	var b4_len = xB4.length;
	var b2_len = b4_len*2 + ((lastBit==='')?0:1);
	var xB2 = (bigInt(xB4,4).toString(2) + lastBit).padStart(b2_len,'0');
	return { b2:xB2, level:b4_len+lastHalfDigit?0.5:0 }
}; // \func

/**
 * Cut head (prefix) of x in binary string and returns tail as base4j string.
 * @param p string base4h input prefix
 * @param x string base4h main input
 * @return array [base4h tail, float level]
 */
Geocode.hlp_base4h_cutPrefix = function (p,x) {
	p = this.hlp_base4h_to_bin(p);
	x = this.hlp_base4h_to_bin(x);
	if (!p || !x) return null; // error, bad number
	if (p.level>x.level) return null; // error, impossible p to be a root
	var x_root = x.b2.slice(0,p.b2.length);
	if (x_root!=p.b2) return null; //error not same root
	var resB2_len = x.b2.length - p.b2.length; // se nao for divisivel por 2 nao pode ser base4, guardar o ultimo bit!
	var res = x.b2.slice(p.b2.length);
	if (resB2_len!=res.length) console.log("bug5")
	var resB4h_len = resB2_len/2.0;
  //console.log("res1=",res)
	if (Number.isInteger(resB4h_len))
		return [bigInt(res,2).toString(4).padStart(resB4h_len,'0'),resB4h_len];
	else {
		var btoh = {"0":"⬒","1":"⬓"};
		var bit = res.slice(-1);
		var res = res.slice(0,-1);
    //console.log("res2=",res)
		var len = Math.floor(resB4h_len);
		return [bigInt(res,2).toString(4).padStart(len,'0') + btoh[bit], resB4h_len];
	}
}; // \func

// // /// //

/**
 * Parses string representing degrees/minutes/seconds into numeric degrees.
 * Based on Chris Veness, http://movable-type.co.uk/scripts/latlong.html
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3° 37′ 09″W).
 * Seconds and minutes may be omitted.
 *
 * @param   {string|number} dmsStr - Degrees or deg/min/sec in variety of formats.
 * @param   {boolean} retStr - controls return as String or as Number.
 * @returns when retStr {string} else {number}, Degrees as decimal number.
 *
 * @example
 *     var lat = Dms.parseDMS('51° 28′ 40.12″ N');
 *     var lon = Dms.parseDMS('000° 00′ 05.31″ W');
 *     var p1 = new LatLon(lat, lon); // 51.4778°N, 000.0015°W
 */
Geocode.parseDMS = function(dmsStr,retStr=false) {
    if (dmsStr===null) return null;
    // check for signed decimal degrees without NSEW, if so return it directly
    if (typeof dmsStr == 'number')
      return isFinite(dmsStr)? (
        retStr? dmsStr.toFixed(this.kx_latLng_ZERO_digits): dmsStr
      ): null;
    // strip off any sign or compass dir'n & split out separate d/m/s
    var dms = String(dmsStr).trim().replace(/^-/, '').replace(/[NSEW]$/i, '').split(/[^0-9.,]+/);
    if (dms[dms.length-1]=='') dms.splice(dms.length-1);  // from trailing symbol
    if (dms == '') return null; //NaN;
    // and convert to decimal degrees...
    var deg;
    switch (dms.length) {
        case 3:  // interpret 3-part result as d/m/s
            deg = dms[0]/1 + dms[1]/60 + dms[2]/3600;
            break;
        case 2:  // interpret 2-part result as d/m
            deg = dms[0]/1 + dms[1]/60;
            break;
        case 1:  // just d (possibly decimal) or non-separated dddmmss
            deg = dms[0];
            break;
        default:
            return null; //NaN;
    }
    //console.log("debug444 ",typeof dmsStr,dmsStr)
    if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg; // take '-', west and south as -ve
    return retStr? Number(deg).toFixed(this.kx_latLng_ZERO_digits): Number(deg);
};


/**
 * Normalize to good numbers any long/lat coordinates (floats or array)  or "lat,lon" string from geoURI.
 * USES:
 *  hlp_parseLngLat(lngLatArray,dmsApply,asStr), with? explicit boolean dmsApply;
 *  hlp_parseLngLat(geoURI_vals,dmsApply,asStr), with explicit boolean dmsApply;
 *  hlp_parseLngLat(lon,lat,dmsApply,asStr), the default mode.
 * NOTE: the convention is GeoJSON, so "The first two elements are longitude and latitude", rfc7946.
 * @param lon mix, boolean dmsApply or optional float longitude.
 * @param lat mix, when string is a geoURI value; else latitude float.
 * @param dmsApply boolean (true) to apply parseDMS().
 * @param asStr boolean (false) to return Strings istead numers
 * @return null or Array of Numbers [longitude,latitude], or Array of Strings.
 */
Geocode.hlp_parseLngLat = function (lon,lat=null,dmsApply=true,asStr=false) {
	if (lon===undefined || lon===null) return null;
	if (lat===undefined) lat=null;
  if (typeof lat == 'boolean')
    [asStr,dmsApply,lat] = [dmsApply,lat,null];
  if (typeof lon=='array' || lon instanceof Array)
    [lon,lat] = lon;
  if (lat===null && typeof lon =='string')
		[lat,lon] = lon.trim().replace(/[\/;:]+/,',').split(','); // parsing geoURI value  old .
  var ll = [lon,lat];
	if (dmsApply)
	  ll = [ Geocode.parseDMS(ll[0],asStr), Geocode.parseDMS(ll[1],asStr) ];
	return (ll[0]===null || ll[1]===null)? null: ll;
}

/**
 * Wrap for hlp_parseLngLat, parsing non-standard LatLon.
 * @return null or Array of Numbers [longitude,latitude], or Array of Strings.
 */
Geocode.hlp_parseLatLon = function (lat,lon=null,dmsApply=true,asStr=false) {
  if (lat===undefined || lat===null) return null;
	if (lon===undefined) lon=null;
  if (typeof lon == 'boolean')
    [asStr,dmsApply,lon] = [dmsApply,lon,null];
  else if (typeof lat=='array' || lat instanceof Array)
    [lat,lon] = lat;
  if (lon===null && typeof lat =='string')
    return this.hlp_parseLngLat(lat,null,dmsApply,asStr);
  else
    return this.hlp_parseLngLat(lon,lat,dmsApply,asStr)
}
////

/**
 * Changes a hash string to correct case or empty when invalid.
 * Generates alert() when showAlert flag.
 * Can be used with all default parameters, that is the same as a=true,
 * Other uses: with string a=geohash or boolean a=false or a=geohash and b=false.
 * @param retHash boolean false. INTErNAL USE.
 * @return boolean.
 */
Geocode.hlp_hash_isValid = function(a,b,retHash=false) {
  var showAlert=true;
  var hash = '';
  if (a!==undefined) {
     if (typeof a === 'boolean') showAlert=a;
     else { // int or string
	   hash = a;
           if (b!==undefined && !b) showAlert=false;
     }
  } // else using hash and showAlert.
  var rgx = new RegExp('^['+this.kx_hash_baseAlphabet+']+$');
  if (!hash || hash.length === 0) {
     if (showAlert) alert("Empty geocode");
     return retHash? null: false;
  } else {
    hash = this.hlp_hashSantize(hash);
    // Normalize case:
	  if (this.kx_hash_baseAlphabet_case=='lower')
	    hash = hash.toLowerCase();
	  else if (this.kx_hash_baseAlphabet_case=='upper')
	    hash = hash.toUpperCase();
	  var r = hash.match(rgx); // VALIDATION
    if (!r && showAlert)
      alert("The string \n"+hash+"\n is not valid!\n All letters MUST be in \n'"+this.kx_hash_baseAlphabet+"'");
	  return retHash? (r? hash: null): r;
  }
}; // \func


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports)
    module.exports = Geocode; // CommonJS, node.js
