'''Sets up the nginx files if not already done.'''

import os
# 1 create error log if doesn't already exist
varLog = "/var/log"
if not os.path.exists(varLog):
    os.makedirs(varLog)
varLogNginx = "/var/log/nginx"
if not os.path.exists(varLogNginx):
    os.makedirs(varLogNginx)
# 2 create access log if doesn't already exist
