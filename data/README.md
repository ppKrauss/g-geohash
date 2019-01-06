
## cities

Files created from http://datasets.ok.org.br/city-codes SQL queries:

```sql
copy (
  select jsonb_agg(jsonb_build_array(uf, name,abbrev3,ibge_id)) 
  from  vw_brcodes_city where abbrev3 is not null
) to '/tmp/cities_br.json' ;

copy (
  select jsonb_agg(jsonb_build_array(uf, name,abbrev3,ibge_id)) 
  from  vw_brcodes_city where abbrev3 is not null and uf='SP'
) to '/tmp/cities_br-sp.json' ;

'''

