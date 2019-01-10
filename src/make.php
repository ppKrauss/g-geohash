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
"geohash-base16"=>[
	"nome"=>'Geohash com base16',
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
"]
/*
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
*/
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
		'4.0'=>'1100km','5.0'=>'850km','6.0'=>'600km','7.5'=>'150km',
		'10.0'=>'30km','12.5'=>'5km','15.0'=>'1km','16.0'=>'500m','17.5'=>'150m',
		'20.0'=>'25m','22.0'=>'10m','22.5'=>'5m', '25.0'=>'1m'
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
	$aux = isset($scale[$ix])? " &nbsp;&nbsp; (~$scale[$ix])": '';
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
	<link rel='shortcut icon' type='image/x-icon' href='./favicon.ico' />

	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css"/>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.3.4/dist/leaflet.css" crossorigin=""
	  integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA=="
	/>
	<style>
		p, fieldset {margin-left: 10pt;}
		fieldset {line-height: 22pt;}
		.selected_text {font-weight: bold;}
		.city-PTS span {margin:0;padding:0;}
		#cell_etc {color:red;font-size:120%; font-weight:bold;}
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
var COVER={};

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

		$('#cover_view').change( function() {
			if ( $(this).is(':checked') ) {alert("Em construção:\\nlembrar de fazer ou pedir para fazer");}
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

<!-- MAPA E SEUS CONTROLES: -->
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

<!-- CÉLULA: -->
	<fieldset><legend>Célula <b>{$NOME0}</b></legend>
		<label style="white-space:nowrap">Geocódigo:
			<input type="text" size="{$CODE_SIZE}" id="dom_geocode" style="font-weight: bold; color:#008; font-size:135%;"/></label>
		  (<span id="dom_geocode_digits" style="font-family:monospace;color:#008">0</span><small> dígitos</small>) &nbsp;&nbsp;&nbsp;
		<label style="white-space:nowrap">Separadores <input type="checkbox" checked="1" id="code_sep"/></label>
		&nbsp;&nbsp;&nbsp;
		<label title="Nível na hierárquia de grade/subgrade das células" style="white-space:nowrap">Nível hierárquico:
			<select id="dom_level" class="latlon" style="font-weight: bold; color:#008; font-size:135%;">
			{$OPTS_LEVEL}
			</select></label>
			&nbsp;&nbsp;<small title="diâmetro e lado de um circulo e de um quadrado de mesma área" id="dom_medidas"></small>
		<br/>
		<code title="Código que substituiria o CEP, ou PlusCode contextualizado por nome de cidade" id="cell_etc"></code>&nbsp;&nbsp;&nbsp;
		<label>Centro em <span style="white-space:nowrap; font-family:monospace">geo:<input
			type="text" title="Latitude (°N/S) e Longitude (°L/O), conforme padrão RFC 5870"
			id="dom_latlon" size="22" maxlength="26" class="latlon" placeholder="GeoURI"/></span>
		</label>
		&nbsp;&nbsp;&nbsp;
		<label id="showBase4" style="white-space:nowrap;">Base4:
			<span id="dom_base4" style="font-family:monospace;color:#888"></span></label>
	</fieldset>

<!-- CIDADES -->

	<div id="city-ALL">
<!-- ["6gwx","6gwz","6gy8","6gy9","6gyb","6gyc","6gyd","6gyf","6gyg","6gz1","6gz4"] -->
		<p class="city-LST">Cidade com bordas apresentadas em vermelho:

		&nbsp;<a href="javascript:void(0);" onclick="cityCanvas.show('sp-spa','city')" id="city-sp-spa">São Paulo (SP)</a>,
		<!-- mostrar amarelo claro ... Cover-set Geohash de "sp-spa"  = ['6gwx','6gwz', '6gy8','6gy9','6gyb','6gyc','6gyd','6gyf','6gyg',  '6gz1','6gz4'] -->
		&nbsp;<a href="javascript:void(0);" onclick="cityCanvas.show('pr-cur','city')" id="city-pr-cur">Curitiba (PR)</a>,
		&nbsp;<a href="javascript:void(0);" onclick="cityCanvas.show('pa-atm','city')" id="city-pa-atm">Altamira (PA)</a>.<!-- IBGE 1500602 -->
		<br/>

		</p>
		<p>Dimensões do município selecionado: <span id="city-MEDIDAS"></span>
		</p>
		<p class="city-PTS">Pontos de controle: <span>(clique em cidade)</span>

			<span id="city-PTS-sp-spa" class="city-PTS-content" style="display:none">
		   <a href="javascript:void(0);" onclick="setRefPoint(-23.561618,-46.655996);">MASP</a>,
		   <a href="javascript:void(0);" onclick="setRefPoint(-23.550375,-46.633937);">Marco-zero-SP</a>,
			 <a href="javascript:void(0);" onclick="setRefPoint(-23.625486,-46.660856);">Aeroporto</a>, ...
			 <br/>Cobertura (<span class="coverNumItems">0</span> items):
			 <textarea rows="2" cols="64">:b4,030333303320,03033321331⬒, 03033330220⬒, 03033330221⬒, 03033330230⬒, 03033330231⬒, 03033330320⬒, 03033330321⬒,
03033321331⬓, 03033330220⬓, 03033330221⬓, 03033330230⬓, 03033330231⬓, 03033330320⬓,
03033330233⬒, 03033330322⬒,
03033330322⬓, 03033330233⬓,
03033332100⬒, 03033332011⬒,
03033330303⬓, 03033330321⬒, 03033330321⬓, 03033330323⬒,
0303332131233⬓,03033321313⬓, 03033330202⬓, 03033330203⬓, 03033330212⬓, 03033330213⬓
			</textarea><label title="Visualizar a cobertura no mapa, em amarelo"><input class="cover_view" type="checkbox"/> visualizar</label>
			<!-- old 	and simplest
			  :b32,6gwx,6gwz,6gy8,6gy9,6gyb,6gyc,6gyd,6gyf,6gyg,6gz1,6gz4
			 -->
			</span>

			<span id="city-PTS-pr-cur" class="city-PTS-content" style="display:none">
		   <a href="javascript:void(0);" onclick="setRefPoint(-25.416667,-49.25);">Centro</a>,
		   <a href="javascript:void(0);" onclick="setRefPoint(-25.404903,-49.230165);">Aeroporto</a>, ...
			 <br/>Cobertura (<span class="coverNumItems">0</span> items):
			 <textarea rows="2" cols="64">:b4,030332113331⬓, 030332113333⬒, 030332113333⬓, 030332131110⬒, 030332113332⬓, 030332113332⬒, 030332113330⬓, 030332113330⬒, 030332113321⬒, 030332113321⬓, 030332113323⬒, 030332113323⬓, 030332131101⬒, 030332131100⬒, 030332113322⬓, 030332113322⬒, 030332113320⬓, 030332113320⬒, 030332113231⬒, 030332113231⬓, 030332113233⬒, 030332113233⬓, 0303321310, 030332113232⬓, 030332113232⬒, 030332113230⬓, 030332113221⬒, 030332113221⬓, 030332113223⬒, 030332113223⬓, 030332113220⬒, 030332113220⬓
			 </textarea><label title="Visualizar a cobertura no mapa, em amarelo"><input class="cover_view" type="checkbox"/> visualizar</label>
			 <!-- old
				 :b32,6gkzv, 6gkzy, 6gkzz, 6gmp8, 6gkzx, 6gkzw, 6gkzt, 6gkzs, 6gkzk, 6gkzm, 6gkzq, 6gkzr, 6gmp2, 6gmp0, 6gkzp, 6gkzn, 6gkzj, 6gkzh, 6gkyu, 6gkyv, 6gkyy, 6gkyz, 6gmn, 6gkyx, 6gkyw, 6gkyt, 6gkyk, 6gkym, 6gkyq, 6gkyr, 6gkyh, 6gkyj
		 	-->
		  </span>

			<span id="city-PTS-pa-atm" class="city-PTS-content" style="display:none">
		   <a href="javascript:void(0);" onclick="setRefPoint(-3.2069074,-52.2188004);">Prefeitura</a>,
		   <a href="javascript:void(0);" onclick="setRefPoint(-3.2535258,-52.249368);">Aeroporto</a>, ...
			 <br/>Cobertura (<span class="coverNumItems">0</span> items):
			 <textarea rows="2" cols="64">:b4,031330312313220, 031330312303311, 03133031231212, 03133031231203, 03133031231231,
03133031231230,03133031231232,03133031231322,03133031231233,03133031231323,
031330301⬒, 031330301⬓, 031330303⬒, 031330303⬓, 031330312⬓, 031330330⬒, 031330312⬒, 031330313⬒, 031330313⬓,
0313203⬒, 0313201⬓, 0313201⬒, 0313210⬒, 0313210⬓,
0313212⬒, 0313213⬒, 0313211⬓, 0313211⬒, 0313300⬒,
0313300⬓, 0313302⬒,03133023⬒
			 </textarea><label title="Visualizar a cobertura no mapa, em amarelo"><input class="cover_view" type="checkbox"/> visualizar</label>
		  </span>


		</p>
</div>
<p>Bloco de notas:<br/>
<textarea id="dom_notes" rows="3" cols="64">
</textarea>
<br/><label title="copiar os geocódigos que clicar no mapa">
	<input type="checkbox" id="dom_notes_chk"/> copiar geocódigos clicados
</label>
</p>

</body>
</html>
HTML;

$f= dirname(__FILE__)."/../site/{$MENU1_CURRENT}.htm";
file_put_contents($f,$TPL);
$f=realpath($f);
file_put_contents('php://stderr', "\n Saved $f");

endforeach; // $RUN_ITENS

file_put_contents('php://stderr', "\n");
