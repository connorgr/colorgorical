import psutil
import subprocess
cmd = "ps | grep \"python run.py --server\" | grep -v grep"

output = subprocess.check_output(cmd, shell=True)

processes = [p for p in output.split('\n') if len(p.split()) > 0]
pIds = [int(p.split()[0]) for p in processes]

for p, pId in zip(processes, pIds):
    print "killing:", p
    p = psutil.Process(pId)
    p.terminate()

subprocess.call('sudo nginx -c /Users/connor/brown/perception/colorgorical/colorgorical-nginx.conf -s quit', shell=True)
