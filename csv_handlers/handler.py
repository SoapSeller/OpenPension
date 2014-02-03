import csv

from db import db_conn, DBNAME

CSV_FILE = 'tmp/Migdal_199_2012_4.csv'

FIELDS = ('managing_body', 'fund', 'report_year', 'report_qurater',
    'instrument_type', 'instrument_sub_type', 'instrument_symbol', 
    'instrument_id', 'underlying_asset', 'industry', 'rating', 'rating_agency',
    'date_of_purchase', 'average_of_duration', 'currency', 'intrest_rate', 
    'yield', 'par_value', 'rate', 'market_cap', 'fair_value', 'rate_of_ipo', 
    'rate_of_fund',  'date_of_revaluation', 'type_of_asset', 'tmp_name')

INT_FIELDS = ('fund', 'report_year', 'report_qurater', 'intrest_rate',
       'yield', 'par_value', 'rate', 'market_cap', 'fair_value', 'fair_value',
       'rate_of_fund', 'tmp_name')


def serialize(values):
    dict_values = dict(zip(FIELDS, values))
    for k,v in dict_values.iteritems():
        if k in INT_FIELDS: 
            # TODO: CHECK VALUES HERE - trying to insert columns line
            if k == 'rate':
                print 'rate', v
            dict_values[k] = int(v)

    print 'dict', dict_values
    return dict_values



def parse_csvfile(file_path):
    with open(file_path) as csvfile:
        fund = csv.reader(csvfile, delimiter=',')
        for row in fund:
            values = tuple(row)
            dict_values = serialize(values) 
            print 'dict', dict_values

            #insert_token = 'insert into {} {} values {}'.format(
            #    DBNAME, CSV_FIELDS, values)
            #print insert_token

    #    managing_body, fund, report_year, report_qurater, instrument_type, instrument_sub_type, instrument_symbol, instrument_id, underlying_asset, industry, rating, rating_agency, date_of_purchase, average_of_duration, currency, intrest_rate, _yield, par_value, rate, market_cap, fair_value, rate_of_ipo, rate_of_fund,  date_of_revaluation, type_of_asset, tmp_name = line.split(',')
    #    print "++++", managing_body 
    #    #cur.execute("insert into %s %s (%s)")



parse_csvfile(CSV_FILE)
#res = cur.fetchone()[0]
