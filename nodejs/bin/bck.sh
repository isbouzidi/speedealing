#!/bin/bash
#l'heure et le jour parce que toutes les deux heures
DATE=`date +%A-%H_%M`
NAME=`uname -n`
#dump all databases;
#for i in `echo "show databases;" | mysql | grep -v Database`
#do
cd /var/tmp/backup
        # dump the database
      	 mongodump -o FullServerBkp
	 tar cvfz chaumeil_$DATE.tgz FullServerBkp
	 rm -R FullServerBkp 
#done

