/**
 * Specialized functions of the generated (by make.php) HTML pages.
 */

/**
 * Sets Lat and lon to the geoURI of the interface.
 *
 * USAGE:
 *   dom_setLatLon(lat,lon[,parse])
 *   dom_setLatLon(lngLat[,parse])
 */
function dom_setLatLon(a,b,parse=true) { // sets the geoURI string of the interface.
	if (!(a instanceof Array)) [a,b]=[[b,a],null]; //lngLat
	if (typeof b == 'boolean') parse=b;
	if (!a || a[0]===null || a[1]===null||a[0]===undefined||a[1]===undefined) //validation
		throw new Error('ER21: invalid null parameters.');
	if (parse)
		a = Geocode.hlp_parseLngLat( a, true, true ); // pad zeros, ret LngLat
	$('#dom_latlon').val( a[1] +','+ a[0] );
	return a;
}

function dom_getLatLon(retStr=false) { // get geoURI and parse it.
  return Geocode.hlp_parseLatLon( $('#dom_latlon').val(), true, retStr ); // ret LngLat!
}

function dom_getLevel() {
	var l = String( $('#dom_level').val() ); // supposing string always!
	l = parseFloat(  l.trim().replace(',','.')  );
	if ( !Geocode.kx_halfLevel_isValid && !Number.isInteger(l) )
		alert("ERROR55: invalid level for kx_halfLevel_isValid=false")
	//console.log("dom_level=",l)
	return l;
}

function dom_setLevel(x) {
	x = parseFloat(x);
	// aqui incluir aqui verificacao de x in options...
	if (x>0){
		$('#dom_level').val(String(x));
		if ( String(x) != $('#dom_level').val() )
			alert("interface ERROR: bug on set level")
		return x;
	} else {
		alert("interface ERROR: invalid level");
		return null;
	}
}



function drawCell(rmLast=true) {
	var CHK_NOTES = $('#dom_notes_chk').is(':checked');
	rmLast = !CHK_NOTES; // novo!
	drawCell_byPoly(Geocode.polygon, $('#fitZoom').is(':checked'), rmLast); //map.js
}

function showCut(p,x,dom_id) {
	//OLD!

	// no futuro buscar a macrocélula adequada a partir dos dados de cobertura.
	//if (!p) p= '030333⬓'; // kx_interno!  "6g"b32 = "030333"b4
	var res = Geocode.hlp_base4h_cutPrefix(p,x);
	if (res) {
		var g32 = Geocode.hlp_base4h_to_outBase(res[0],res[1]);
		$(dom_id).text(g32);
	} else
		$(dom_id).text("(inválido)");
}


/**
 * Main function to show a cell in the map, by its coordinates.
 * NOTE: get cell's level from interface.
 * USAGE:
 *   setRefPoint(lat,lon)
 *   setRefPoint(lngLat)
 * @param lat mix {float or string} latitude or {array} lngLat=[longitude,latitude].
 * @param lon mix level when lat is array, else {null} or {float or string} longitude.
 * old param lev mix {null} or {float} level.
 * @return null or string hash
 */
function setRefPoint(lat, lon) {
	if (typeof lat=='array' || lat instanceof Array) {
		//lev=lon;
		[lon,lat] = lat;
	}
	var ll = Geocode.hlp_parseLatLon(lat,lon,true); // ret LngLat or null
	//if (!lev)
	var lev = dom_getLevel();
	if (ll && lev) {
		var CHK_NOTES = $('#dom_notes_chk').is(':checked');
		Geocode.set(ll, lev);
		dom_setLatLon(ll, true);
		drawCell();
		Geocode.hashRender();  // rendering hash.
		var showHash = Geocode.hash_rendered;
		if (Geocode.kx_hash_base==4)
			showHash = Geocode.hash_base4h;
		else
			$('#dom_base4').text(Geocode.hash_base4h);
		$('#dom_geocode').val(showHash);
		$('#dom_geocode_digits').html(Geocode.hash.length);
		if (COVER.cover_rgxMcl && (!Geocode.cf_isoOnlyFor32 ||  Geocode.kx_hash_base==32)
			&& (t = Geocode.hash_base4h.match(COVER.cover_rgxMcl))) {
			//console.log("t=",t," of ",COVER.IdxOf)
			if (Geocode.hash_base4h<15) $('#cell_etc').text('(inválido)')
			else {
				var hash = '<small>BR-'+COVER.name+'-</small>'+Geocode.hashRender(
					Geocode.hlp_int_to_outBase(COVER.IdxOf[t[1]],false)
					+ Geocode.hlp_base4h_to_outBase(t[2],t[2].length)
				);
				$('#cell_etc').html(hash);
			}
		} else
			$('#cell_etc').text('');
		mapCanvas_popup(Geocode.center, showHash); // rmLast as CHK_NOTES?
		if (CHK_NOTES) {
			var aux = (Geocode.kx_hash_base==4)? Geocode.hash_base4h: Geocode.hash;
			var tmp = $('#dom_notes').val();
			$('#dom_notes').val(tmp +', '+ aux);
		}
		var medidas = 'area='+Geocode.m_area.toFixed(1)+' m²; diam='+Geocode.m_diam+'; lado='+Geocode.m_side;
		$('#dom_medidas').html(medidas);
		return Geocode.hash;
	} else return null;
} // \func


 ///

function onMapClick(e) {  // used by map.js
	if( !$('#ptclick').is(':checked') )
		setRefPoint(e.latlng.lat, e.latlng.lng);
}

function onMapMouseMove(e) {  // used by map.js
  $('#showMouseMove').text(
		e.latlng.lat.toFixed(6) + "," + e.latlng.lng.toFixed(6)
	)
}


// // // // // //

function getFromUrl() {  // parse URL, get parameters
  var UrlRequest = window.location.hash;
	var ret=null;
	// e.g. #6gzm/sp-mtl , #6gycf/sp-spa or #6gkz/pr-cur
	if ( m = UrlRequest.match(/^#geo:(\-?\d+\.\d+,\-?\d+\.\d+)$/) )
		ret = {geo:m[1]};
  else if ( m = UrlRequest.match(/^#([a-z0-9\+ ]+)[\/\-:;]+(.+)$/i) )
		ret = {geocode:m[1],city:m[2]};
	else if ( m = UrlRequest.match(/^#([A-Z][a-z0-9A-Z\-\.\+ ]+)[\/\-:;]+([a-z0-9]+)$/) )
		ret = {geocode:m[2],city:m[1]};
	else if ( m = UrlRequest.match(/^#([a-z0-9\+ ]+)$/i) )
		ret = {geocode:m[1]};
	return ret;
} // \func

function runRequest(reqDefault={geo:"-23.550375,-46.633937",geo_level:20,city:"BR-SP-SPA"}
) {
	var c = null,
	    r = getFromUrl();
	if (!r) r = reqDefault;
	if (r) { // check URL params
		var used=false;
		if ( r.geocode && (c = Geocode.setByHash_whenIsValid(r.geocode)) ) {
			var ckeckCity = {"030333":"sp-spa",  "030332":"pr-cur", "0313":"pa-atm"}; // revisar
			var ckeckCity_rgx = /^(030333|030332|0313)/; // revisar
			var ck = c.hash_base4h.match(ckeckCity_rgx);
			if (ck) r.city=ckeckCity[ck[1]];
			var hash = c.hash; // $('#dom_geocode').val(c.hash)
			var level = c.level; // $('#dom_level').val(c.level)
			c = c.center;
		} else if (r.geo) {
			var level = r.geo_level? r.geo_level: 15;
			//$('#dom_level').val(level); // 1km
			c = Geocode.hlp_parseLatLon(r.geo);
		}
		//console.log("a",level,c);
		if (r.city) {
			//console.log("debug1 city ok:",r)
			var city = r.city.replace(/^BR\-/i,'').toLowerCase();
			cityCanvas.show(city,'city'); // !important
			used=true;
		}
		if (c) {
			//$('#dom_geocode').val(hash);
			$('#dom_level').val(level);
			setRefPoint(c);
			used=true;
		}
		if (!used)
			console.log("interface ERROR: invalid geocode at URL")
	}
} // \func


////


/**
 * LIXO Returns specified argument from query string.
 *
 * @params  {string} key - Argument to be returned.
 * @returns {string} Value of key ('' for ?arg=, null for ?arg, undefined if not present).
 */
function getQueryArg(key) {
    // look for key prefixed by ?/&/;, (optionally) suffixed
    // by =val (using lazy match), followed by &/;/# or EOS
    var re = new RegExp('[?&;]'+key+'(=(.*?))?([&;#]|$)');
    var results = re.exec(location.search);
    if (results == null) return undefined;    // not found
    if (results[2] == undefined) return null; // ?key without '='
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
function getQueryArgSplitFor(key) {
    var srch = location.search.substring(1);  // lose the initial '?'
    var args = srch.split(/[&;]/);            // list of field=value pairs
    for (var i=0; i<args.length; i++) {       // for each arg
        var arg = args[i].split('=');         // split at '='
        if (arg[0] == key) {                  // arg we're looking for?
            if (arg.length == 1) return null; // ?key without '='
            return decodeURIComponent(arg[1].replace(/\+/g, ' '));
        }
    }
    return undefined;                         // not found
}
