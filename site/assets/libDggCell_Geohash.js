/**
 * Geohash's DGG cell encode to base4 or decode.
 */
var DGGcell = {
  // CONFIGS:
  dggName: 'Geohash', // DGG name, algorithm name.
  base_alphabet: '0123', // base4
  BitMAX: 2, // change to 2 for base4
  GeoJSON_title: 'geohash base4: ',
  // STATES, defining a temporary instance of cell.
  id0: '', // not null only when DGG technology use it, as S2geometry face.
  id: null,  // null indicate undefined. Not null is a base4 key.
  level: null, // hierarchical level of DGGcell.id, so, as id is base4, id.length/2.
  polygon: null, // a GeoJSON polygonal representation of the cell
  center: null, // a GeoJSON point representation of the centroid of the cell.

  // METHODS: set,refreshByLevel,
};

DGGcell.getState = function() {
  return {
    id0: this.id0
    ,id: this.id
    ,base: this.base  //4!
    ,level: this.level  // can be half?
    ,center: this.center //lngLat
    ,bounds: this.bounds // GeoJSON
    ,polygon: this.polygon // GeoJSON
  }
} // \func

DGGcell.base = DGGcell.base_alphabet.length; //  4

console.log("DGGcell v1.0! base=",DGGcell.base);

/**
 * Clean state.
 * Public method.
 */
DGGcell.clean = function() {
  this.id0    = this.id     = '';
  this.center = this.bounds = this.polygon = null;
  return this;
}

/**
 * Set state by latitude/longitude or by existing cell ID.
 * USAGE:
 *  set(hash)
 *  set(lngLat,level)
 *  set(lat,lon,level)
 * @param lat, mix, string geoash or float latitude.
 * @param lon float, longitude; when a is float.
 * @param level integer; when a is float.
 */
DGGcell.set = function(lat, lon, level) {
  if (typeof lat=='array' || lat instanceof Array) { // Set by lngLat
    level = lon;
    [lon,lat] = lat;
  }

  if (lat===undefined || lat===null)
    return null;
  else if (typeof lat == 'string') {  // Set by hash
    this.clean()
    .getCenter(lat) // lat is an id (base4 Geohash).
    .getPoly();  // cell's GeoJSON polygon
  } else if (!lon || !level) {
    return null;
  } else // Set by lat/lon
    this.clean()
    .encode(lat, lon, level)
    .getCenter()  // redo lat/lon by cell
    .getPoly();

  return this;
}

/**
 * Refresh value of this.polygon with last this.bounds.
 * Private method.
 */
DGGcell.getPoly = function(geohash,latlng_precision=7) {
  var b = this.bounds.map( x  =>  Number(x.toFixed(latlng_precision)) );
  //0latMin,1lonMin,2latMax,3lonMax
  this.polygon = this.GeoJSON_draw(
    // [latMin,lonMin],  [latMax,lonMin], [latMin,lonMax], [latMax,lonMax], [latMin,lonMin]
    //bom [latMin,lonMin],  [latMax,lonMin], [latMax,lonMax], [latMin,lonMax], [latMin,lonMin]
    //[y,x] [[b[0],b[1]],  [b[2],b[1]], [b[2],b[3]], [b[0],b[3]], [b[0],b[1]]]
    [[b[1],b[0]],  [b[1],b[2]], [b[3],b[2]], [b[3],b[0]], [b[1],b[0]]]
    ,'polygon', this.GeoJSON_title+this.id0+this.id
  );
  return this;
}
/**
 * Encodes latitude/longitude to geohash, either to specified level or to automatically
 * evaluated level. Refreshes this.id value.
 * Private method.
 *
 * @param   {number} lat - Latitude in degrees.
 * @param   {number} lon - Longitude in degrees.
 * @param   {number} [level] - Number of characters in resulting geohash.
 * @returns {string} Geohash of supplied latitude/longitude.
 * @throws  Invalid geohash.
 *
 * @example
 *     var geohash = DGGcell.encode(52.205, 0.119, 7); // geohash: 'u120fxw'
 */
DGGcell.encode = function(lat, lon, level) {
    //lat = Number(lat);
    //lon = Number(lon);
    //level = Number(level);
    if (!lat || !lon || !level || isNaN(lat) || isNaN(lon) || isNaN(level))
      throw new Error('Some invalid Geohash parameter (lat='+lat+', lon or level='+level+') for DGGcell.encode method');
    var idx = 0; // index into base_alphabet map
    var bit = 0; // each char holds 5 bits
    var evenBit = true;
    var geohash = ''; // or DGGcell.hash?

    var latMin =  -90, latMax =  90;
    var lonMin = -180, lonMax = 180;

    while (geohash.length < level) {
        if (evenBit) {
            // bisect E-W longitude
            var lonMid = (lonMin + lonMax) / 2;
            if (lon >= lonMid) {
                idx = idx*2 + 1;
                lonMin = lonMid;
            } else {
                idx = idx*2;
                lonMax = lonMid;
            }
        } else {
            // bisect N-S latitude
            var latMid = (latMin + latMax) / 2;
            if (lat >= latMid) {
                idx = idx*2 + 1;
                latMin = latMid;
            } else {
                idx = idx*2;
                latMax = latMid;
            }
        }
        evenBit = !evenBit;

        if (++bit == DGGcell.BitMAX) {
            // 2 or 5 bits, gives us a character: append it and start over
            geohash += DGGcell.base_alphabet.charAt(idx); // base4 use the base32 alphabet
            bit = 0;
            idx = 0;
        }
    }
    this.id = geohash;
    this.level = geohash.length; // base4 is the hierarchy level
    return this;
};

/**
 * Decode geohash to latitude/longitude (location is approximate centre of geohash cell,
 *     to reasonable level).
 *
 * @param   {string} geohash - Geohash string to be converted to latitude/longitude.
 * @returns {array[longitude,latitude]} (Center of) geohashed location.
 */
DGGcell.getCenter = function(geohash) {
    this.getBounds(geohash); // the hard work
    var bd = this.bounds;
    // == [bd[0]=latMin, bd[1]=lonMin, bd[2]=latMax, bd[3]=lonMax];
    // cell centre
    var lat = (bd[0] + bd[2])/2;
    var lon = (bd[1] + bd[3])/2;
    // round to close to centre without excessive level: ⌊2-log10(Δ°)⌋ decimal places
    lat = Number(  lat.toFixed(Math.floor(2-Math.log(bd[2]-bd[0])/Math.LN10))  );
    lon = Number(  lon.toFixed(Math.floor(2-Math.log(bd[3]-bd[1])/Math.LN10))  );

    this.center = [lon,lat]; // GeoJSON point coordinates
    return this;
};


/**
 * Returns SW/NE latitude/longitude bounds of specified geohash.
 *
 * @param   {string} geohash - Cell that bounds are required of.
 * @returns GeoJSON BBOX
 * @throws  Invalid geohash.
 */
DGGcell.getBounds = function(geohash) {
    if (geohash===undefined) geohash=this.id;
    //if (!geohash || !this.hash_isValid(geohash)) throw new Error('Invalid geohash');
    if (!geohash) throw new Error('Invalid enpty param for DGGcell.getBounds');
    var evenBit = true;
    var latMin =  -90, latMax =  90;
    var lonMin = -180, lonMax = 180;

    for (var i=0; i<geohash.length; i++) {
        var chr = geohash.charAt(i);
        var idx = this.base_alphabet.indexOf(chr);  // ok for base4, use same alphabet.
        if (idx == -1) throw new Error('Invalid geohash for bounds()');

        for (var n=this.BitMAX-1; n>=0; n--) {
            var bitN = idx >> n & 1;
            if (evenBit) {
                // longitude
                var lonMid = (lonMin+lonMax) / 2;
                if (bitN == 1) {
                    lonMin = lonMid;
                } else {
                    lonMax = lonMid;
                }
            } else {
                // latitude
                var latMid = (latMin+latMax) / 2;
                if (bitN == 1) {
                    latMin = latMid;
                } else {
                    latMax = latMid;
                }
            } // \else evenBit
            evenBit = !evenBit;
        } // \fot n
    }  // \for i
    this.bounds = [latMin,lonMin,latMax,lonMax]; // GeoJSON BBOX.
    return this;
};



// ///

DGGcell.GeoJSON_draw = function(coordinates_array,objType,name) {
  return { "type": "Feature",
    "properties": {"name":name},
    "geometry": {
       "type": (!objType || objType=="polygon")? "Polygon":"Point",
       "coordinates": [coordinates_array]
     }
  };
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = DGGcell; // CommonJS, node.js
