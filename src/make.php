<?php
/**
 * MAKE files HTML da navgegação de testes do Projeto CLP.
 * USO:
 *   php make.php # roda tudo
 *   php make.php nome | more  # debug
 * SUGESTAO: juntar lat e long em um campo só, como geoURI.
 */
 // let Geocode = Object.assign( Object.create( Object.getPrototypeOf(OpenLocationCode)), OpenLocationCode);

$MENU1 = [
	"geohash-base32ghs"=>[
		"nome"=>'Geohash padrão (base32ghs)',
		"lib"=>'Geohash',
		"baseBits"=>5,
	  "max_nivel"=>25, "nivel_sel"=>20, "nivel_step"=>2.5,
    "digits_group"=>3,	"js_onload"=>'',
	],
	"geohash-base32pt"=>[
		"nome"=>'Geohash com base32pt',
		"lib"=>'Geohash',
		"baseBits"=>5,
		"max_nivel"=>25, "nivel_sel"=>20,
		"nivel_step"=>2.5, "digits_group"=>3,
		"js_onload"=>"
		Geocode.cf_hash_baseAlphabetLabel='pt'
		Geocode.kx_hash_baseAlphabet = '0123456789BCDFGHJKLMNPQRSTUVWXYZ'; // base32pt, non-silabic (for Portuguese)
    Geocode.kx_hash_baseAlphabet_case = 'upper';
"],
"geohash-base16h"=>[
	"nome"=>'Geohash com base16h',
	"lib"=>'Geohash',
	"baseBits"=>4,
	"halfLevel"=>false,
	"first_nivel"=>4,
	"max_nivel"=>25,
	"nivel_sel"=>20,
	"nivel_step"=>2,
	"digits_group"=>4,
	"js_onload"=>"
	// gambi, please change to Geocode.config(etc).
	Geocode.cf_hash_baseAlphabetLabel='js'
	Geocode.cf_hash_base=16; // cuts base32
	Geocode.cf_digSepRegex = /([^\+\-\.,;]{4})/g;  // by 4.
	Geocode.kx_hash_baseAlphabet = '0123456789abcdef';
	Geocode.kx_hash_baseAlphabet_case = 'lower';
	Geocode.kx_hash_baseBits = 4; // ln2(base)=ln(base)/ln(2).
	Geocode.kx_hash_base = Geocode.kx_hash_baseAlphabet.length;	//16
	Geocode.kx_halfLevel_isValid = true;
"],
"geohash-base4h"=>[
				 "nome"=>'Geohash com base4h',
				 "halfLevel"=>true,
				 "baseBits"=>2,
				 "digits_group"=>5,
				 "lib"=>'Geohash',
				 "max_nivel"=>24, "nivel_sel"=>18, "nivel_step"=>0.5,
				 "js_onload"=>"
	Geocode.cf_hash_baseAlphabetLabel='js';
	Geocode.cf_digSepRegex = /([^\+\-\.,;]{5})/g;
	Geocode.kx_hash_baseAlphabet = '0123'; // base4
	Geocode.kx_hash_base = Geocode.kx_hash_baseAlphabet.length;	//4
	Geocode.kx_hash_baseAlphabet_case = false;
	Geocode.kx_hash_baseBits = 2;
	Geocode.kx_halfLevel_isValid = true;
"],
	"geohash-base4"=>[
           "nome"=>'Geohash com base4',"digits_group"=>5,
					 "lib"=>'Geohash',
					 "baseBits"=>2,
					 "max_nivel"=>24, "nivel_sel"=>20, "nivel_step"=>1,
					 "js_onload"=>"
		Geocode.base_alphabet = '0123'; // base4
		Geocode.base = Geocode.base_alphabet.length; //4
    Geocode.base_alphabet_case = '-';
		Geocode.BitMAX = 2;
		Geocode.cf_digSepRegex = /([^\+\-\.,;]{5})/g;
"],
"plusCode"=>[
	"nome"=>'OLC (grade do PlusCode)',
	"baseBits"=>5,
	"lib"=>'./DGGcell_OLP',  //'https://cdn.jsdelivr.net/openlocationcode/latest/openlocationcode.js',
	"max_nivel"=>22,
	"nivel_sel"=>12,
	"nivel_step"=>1,
	"digits_group"=>3,
	"js_onload"=>''
],
];
$RUN_ITEM = ($argc>1)? $argv[1]: '';
if ($RUN_ITEM && !isset($MENU1[$RUN_ITEM])) die("\nERRO, item '$argv[1]' desconhecido. \n");
$RUN_ITENS = $RUN_ITEM? [$RUN_ITEM]: array_keys($MENU1);

// // //  MAIN

$jsPath = './assets';

foreach($RUN_ITENS as $MENU1_CURRENT):

$CUR_ITEM = $MENU1[$MENU1_CURRENT];

$NOME0 = preg_replace('#\([^\)]+\)#', '', $CUR_ITEM['nome']);
$JSLIB = $CUR_ITEM['lib'];
if (substr($JSLIB,0,4)!='http')
	$JSLIB = (substr($JSLIB,0,1)!='.')? "$jsPath/libDggCell_{$JSLIB}.js": "$JSLIB.js";

$OPTS1='';
foreach($MENU1 as $val=>$r) if ($val!=$MENU1_CURRENT) {
	//file_put_contents('php://stderr', "\n\t(debug) $val");
	$OPTS1.= "\n\t<option value='$val'>{$r['nome']}</option>";

}

if (isset($CUR_ITEM['first_nivel']))
  $xx=$CUR_ITEM['first_nivel'];
else
	$xx=($CUR_ITEM['baseBits']<4)? 2 : 5;

if ($CUR_ITEM['lib']=='Geohash') $scale = [
		'4.0'=>'1100km','5.0'=>'800km','6.0'=>'600km','7.5'=>'150km',
		'10.0'=>'30km','15.0'=>'1km','16.0'=>'500m',
		'20.0'=>'30m','22.0'=>'10m','22.5'=>'5m', '25.0'=>'1m'
	];
else $scale = [];

$OPTS_LEVEL='';
$HALFLEVEL=isset($CUR_ITEM["halfLevel"])? $CUR_ITEM["halfLevel"] : false;
$step = $CUR_ITEM['nivel_step']? $CUR_ITEM['nivel_step']: 1;
for($i=$xx; $i<=$CUR_ITEM['max_nivel']; $i += $step) {
	$gambi = str_replace(',','.',"$i");
	$x = floor($i);
  $x = ($x==$i)? $i: "{$x}½";
	$ix = number_format($i,1);
	$aux = isset($scale[$ix])? " (~$scale[$ix])": '';
	$OPTS_LEVEL.= "\n\t<option value='$gambi'"
	      .( ($i==$CUR_ITEM['nivel_sel'])? " selected": "" )
				.">L$x$aux</option>";
} // i


$CODE_SIZE = round(5+ $CUR_ITEM['max_nivel']*2/$CUR_ITEM['baseBits']);

file_put_contents('php://stderr', "\n\t... processing $MENU1_CURRENT");


// // // // //
$TPL = <<<HTML
<!DOCTYPE html>
<html>
<head>
	<title>CLP Viewer</title>

	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css"/>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.3.4/dist/leaflet.css" crossorigin=""
	  integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA=="
	/>
	<style>
		p, fieldset {margin-left: 10pt;}
		.selected_text {font-weight: bold;}
		.city-PTS span {margin:0;padding:0;}
	</style>

	<script src="http://code.jquery.com/jquery-3.0.0.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/big-integer/1.6.40/BigInteger.min.js"></script>
	<script src="https://npmcdn.com/@turf/turf@5.1.6/turf.min.js"></script>
	<script src="https://unpkg.com/leaflet@1.3.4/dist/leaflet.js" crossorigin=""
	    integrity="sha512-nMMmRyTVoLYqjP9hrbed9S+FzjZHW5gY1TWCHA5ckwXZBadntCNs8kEqAWdrb9O7rxbCaA4lKTIWjDXZxflOcA=="
	></script>
  <script src="http://lab.digital-democracy.org/leaflet-bing-layer/leaflet-bing-layer.js"></script>

	<script src="{$jsPath}/lib_Geocode.js"></script>
	<script src="{$JSLIB}"></script>
	<script src="{$jsPath}/domPage.js"></script>

<script>

var selectedByUrl = '';

$(document).ready(function() {  //  ONLOAD

    {$CUR_ITEM['js_onload']}

		Geocode.dggCell = DGGcell; // inicializa.
	  //  fazer o mesmo com Cover ou suas CoverCell
	  Geocode.cleanStates();
		if (Geocode.kx_hash_base==4)
			$('#showBase4').hide();

		$('#ptclick_text').css('font-weight', 'bold');
		$( "#ptclick" ).click(function() {
	     if( $(this).is(':checked') ) {
	       $('#zoomIn_text').css('font-weight', 'bold');
	       $('#ptclick_text').css('font-weight', 'normal');
	     } else {
	       $('#zoomIn_text').css('font-weight', 'normal');
	       $('#ptclick_text').css('font-weight', 'bold');
	     }
		});

		$('#dom_geocode').change( function() {
			var c = Geocode.setByHash_whenIsValid( $('#dom_geocode').val() );
			if (c) {
				$('#dom_level').val(c.level)
				setRefPoint(c.center);
			} // gambi, calcula hash novamente
			else console.log("interface ERROR: invalid geocode");
		});

		$('#dom_latlon').change( function() {
			// editing lat or lon, refresh all.
			var c = dom_getLatLon();
			if (c) setRefPoint(c);
		});

		$('#dom_level').change( function() {
			var c = dom_getLatLon();
			if (c) setRefPoint(c);
		});

		$('#code_sep').change( function() {
			Geocode.cf_hash_sep = $(this).is(':checked')?  '.':  ''; // for next
			$('#dom_geocode').val(
				Geocode.hashRender( $('#dom_geocode').val(), true )
			);
		});

		runRequest() // checks URL and run parsed parameters.

}); //ONLOAD
</script>
</head>

<body>

<p>Localize com geocódigos!
	&nbsp;
	<a target="_blank" href="http://www.openstreetmap.com.br/CLP/site/index_CLPcoord/#comparando-candidatos">Grade selecionada</a>:
	<b>{$CUR_ITEM['nome']}</b>. Clique no mapa ou ...
	&nbsp;
	<select id="usetec" onchange="if (this.value) window.open(this.value+'.htm','_self',false);">
	<option value="" selected>-- Selecione outra grade --</option>
	{$OPTS1}
	</select>
</p>

<div id="mapid" style="width: 100%; height: 400px;"></div>
<script src="assets/map.js"></script>

<p>
	Zoom <span id="zoom_val">16</span>:
	&nbsp; &nbsp;
	<label title="Ativa click de pega-ponto no mapa, ou zoom-in onClick">
	  <input type="checkbox" id="ptclick"/>
	  <i id="zoomIn_text">double-click zoom-in</i>
	</label>
	&nbsp;
	(or <span id="ptclick_text">click-point</span>
	&nbsp;&nbsp;&nbsp;&nbsp;<label title="Zoom-fit to the cell">
	    <input type="checkbox" id="fitZoom" checked="1">
	    <i>fit zoom to cell</i></label>).
	&nbsp; &nbsp;
	<span title="geoURI (latitude e longitude) do mouse quando apontando posição sobre o mapa"
	      style="white-space:nowrap;font-family:monospace">geo:<span id="showMouseMove">?</span></span>
</p>

<form><!-- remover tag form -->
	<fieldset><legend>Célula <b>{$NOME0}</b></legend>
		<label style="white-space:nowrap">Geocódigo:
			<input type="text" size="{$CODE_SIZE}" id="dom_geocode" style="font-weight: bold; color:#008; font-size:135%;"/></label>
		  (<span id="dom_geocode_digits" style="font-family:monospace;color:#008">0</span><small> dígitos</small>) &nbsp;&nbsp;&nbsp;
		<label style="white-space:nowrap">Separadores <input type="checkbox" checked="1" id="code_sep"/></label>
		&nbsp;&nbsp;&nbsp;
		<label style="white-space:nowrap">Nível hierárquico:
			<select id="dom_level" class="latlon" style="font-weight: bold; color:#008; font-size:135%;">
			{$OPTS_LEVEL}
			</select></label>
		<br/>
		<label>Centro em <span style="white-space:nowrap; font-family:monospace">geo:<input
			type="text" title="Latitude (°N/S), Longitude (°L/O)"
			id="dom_latlon" size="22" maxlength="26" class="latlon" placeholder="GeoURI"/></span>
		</label>
		&nbsp;&nbsp;&nbsp;
		<label id="showBase4" style="white-space:nowrap;">Base4:
			<span id="dom_base4" style="font-family:monospace;color:#888"></span></label>
	</fieldset>

<!-- outr fieldset -->

	<div id="city-ALL">
		<p class="city-LST">Cidade com bordas apresentadas em vermelho:
		&nbsp;<a href="javascript:void(0);" onclick="cityCanvas.show('sp-spa','city')" id="city-sp-spa">São Paulo (SP)</a>,
		<!-- mostrar amarelo claro ... Cover-set Geohash de "sp-spa"  = ['6gwx','6gwz', '6gy8','6gy9','6gyb','6gyc','6gyd','6gyf','6gyg',  '6gz1','6gz4'] -->
		&nbsp;<a href="javascript:void(0);" onclick="cityCanvas.show('pr-cur','city')" id="city-pr-cur">Curitiba (PR)</a>.
		</p>
		<p class="city-PTS">Pontos de controle na cidade selecionada: <span>(clique em cidade)</span>
			<span id="city-PTS-sp-spa" style="display:none">
		   <a href="javascript:void(0);" onclick="setRefPoint(-23.561618,-46.655996);">MASP</a>,
		   <a href="javascript:void(0);" onclick="setRefPoint(-23.550375,-46.633937);">Marco-zero-SP</a>, ...
		  </span>
			<span id="city-PTS-pr-cur" style="display:none">
		   <a href="javascript:void(0);" onclick="setRefPoint(-25.48656,-49.2744);">ponto-lixo1</a>,
		   <a href="javascript:void(0);" onclick="setRefPoint(-25.63145,-49.3595);">ponto-lixo2</a>, ...
		  </span>
		</p>
</div>

</form>


</body>
</html>
HTML;

$f= realpath( dirname(__FILE__)."/../site/{$MENU1_CURRENT}.htm" );
file_put_contents($f,$TPL);
file_put_contents('php://stderr', "\n Saved $f");

endforeach; // $RUN_ITENS

file_put_contents('php://stderr', "\n");