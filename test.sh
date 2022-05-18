DIR=$1

cd $DIR

rm -f ./results/results.csv
rm -f ./results/results.html
echo "asc_liftoff\n$(cat ./results/asc_liftoff.txt)" > ./results/asc_liftoff.txt
echo "asc_turbofan\n$(cat ./results/asc_turbofan.txt)" > ./results/asc_turbofan.txt
echo "js_ignition\n$(cat ./results/js_ignition.txt)" > ./results/js_ignition.txt
echo "js_sparkplug\n$(cat ./results/js_sparkplug.txt)" > ./results/js_sparkplug.txt
echo "js_turbofan\n$(cat ./results/js_turbofan.txt)" > ./results/js_turbofan.txt
paste -d "," ./results/asc_liftoff.txt ./results/asc_turbofan.txt ./results/js_ignition.txt ./results/js_sparkplug.txt ./results/js_turbofan.txt > ./results/results.csv
cat ./results/results.csv | npx chart-csv > ./results/results.html

cd ../../../..
