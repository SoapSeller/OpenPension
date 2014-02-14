import logging
import psycopg2
import psycopg2.extensions
 

DBNAME = ''
DBUSER = ''
DBPASS = ''
DBHOST = ''
DBPORT = ''


logger = logging.getLogger('sql_debug')


class LoggingCursor(psycopg2.extensions.cursor):
    def execute(self, sql , args=None):
        logger.info(self.mogrify(sql, args))

        try:
            psycopg2.extensions.cursor.execute(self, sql, args)
        except Exception, exc:
            logger.error("%s: %s" % (exc.__class__.__name__, exc))
            raise


conn = psycopg2.connect("dbname=%s user=%s password=%s host=%s port=%s" % 
    (DBNAME, DBUSER, DBPASS, DBHOST, DBPORT))
db_conn = conn.cursor(cursor_factory=LoggingCursor)



