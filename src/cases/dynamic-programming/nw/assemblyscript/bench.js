import {
  benchmarkWrapper,
  mean,
  peak,
  min,
} from '../../../../utils/benchmarkWrapper';

const ascModule = new WebAssembly.Module(readbuffer(arguments[0]));

const results = await benchmarkWrapper({
  async before() {
    this.instance = new WebAssembly.Instance(ascModule, {
      env: {
        abort(msgPtr, fileNamePtr, lineNumber) {
          console.log(msgPtr, fileNamePtr, lineNumber);
          throw Error('ARRGGH');
        },
      },
    });
  },
  async run() {
    this.instance.exports.main(
      'adfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaffadfasdfsadfdfasdfsdafsdafdfasdffasdfasdfasdfssadfasdfdfasdfasdfasdfsdaff',
      'asdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdasdfsadfsadfsadfsadfasdfsdafsadfsadfsfasasdfasdfsadfadsfsdafsdafdfsdfasdfsdfsdafasdfsdfsdfsdfsdfsdfsadgs',
    );
  },
  numWarmup: 0,
});

console.log([mean(results), peak(results), min(results)].join());