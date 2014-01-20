import csv
import logging
import psycopg2
import psycopg2.extensions


class LoggingCursor(psycopg2.extensions.cursor):
    def execute(self, sql, args=None):
        logger = logging.getLogger('sql_debug')
        logger.info(self.mogrify(sql, args))

        try:
            psycopg2.extensions.cursor.execute(self, sql, args)
        except Exception, exc:
            logger.error("%s: %s" % (exc.__class__.__name__, exc))
            raise


conn = psycopg2.connect(
    "dbname=op user=oprw password=oprw host=54.218.109.190 port=5432")
cur = conn.cursor(cursor_factory=LoggingCursor)
cur.execute("select count(*) from Dev7")
res = cur.fetchone()[0]
print 'res', res
