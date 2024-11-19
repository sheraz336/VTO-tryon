import { useEffect, useRef } from 'react';
import './App.css'
import { createMediaStreamSource, createVideoSource, bootstrapCameraKit, Transform2D, remoteApiServicesFactory, Injectable } from '@snap/camera-kit';

let run = false;
export default function App() {
  const execRef = useRef(0)
  
  const launch = async () => {
    if (run) return;
    run = true;
    console.log("Init Lens")
    // alert("inittt")
    try {
      await main()
      // alert("done")
    } catch (e) {
      alert(e)
    }
  }

  useEffect(() => {
    if (execRef.current++ !== 0) return
    launch()
  }, [])
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      {/* <div className='w-1/3 h-screen bg-red-400'>
        <video src='/test_video.mp4' controls id='test-video' />
        <img src={TextureImage} width={34} height={34} />
      </div>*/}
      <canvas className='w-screen h-screen sm:w-full sm:h-full' id='my-canvas'>
      </canvas>
    </div>
  )
}

async function readImage(url) {
  let r = await fetch(url, {
    // mode:"cors",
    headers: {
      Accept: "application/json",
    },
  })

  //read all chunks
  let chunks = []
  let chunk = { done: false }
  let chunksTotalLength = 0;
  try {
    do {
      chunk = (await r.body.getReader().read())
      if (chunk.value) {
        chunks.push(chunk.value)
        chunksTotalLength += chunk.value.length
      }
    } while (!chunk.done)
  } catch (e) {
    console.log(e)
  }

  // Create a new array with total length and merge all chunks
  let mergedArray = new Uint8Array(chunksTotalLength);
  let offset = 0;
  chunks.forEach(item => {
    mergedArray.set(item, offset);
    offset += item.length;
  });

  console.log(mergedArray);
  console.log(chunks)
  return mergedArray
}

let i = 0;
async function main() {
  let params = new URLSearchParams(window.location.search)
  // const baseUrl = "http://192.168.68.252:3000"
  const baseUrl = "https://vto-api.onrender.com"
  let textureUrl = baseUrl + "/textures/texture_" + params.get("id") + ".png"
  // textureUrl = params.get("id") ?? ""
  const model = params.get("model")

  const catFactsService = {
    apiSpecId: "8b0fa3ea-f062-4ec2-991b-8d55c29489de",
    getRequestHandler(request) {
      // if (request.endpointId !== "fact") return;
      console.log("END POINT HIT ", i)
      console.log(request.parameters)
      if (i++ >= 1) {
        console.log("data received")
        return (reply) => {
          reply({
            status: "success",
            metadata: {},
            body: new TextEncoder().encode("ni hao")
          })
        }
      }
      return (reply) => {
        readImage(textureUrl)
          .then((res) => {

            return reply({
              status: "success",
              metadata: { idx: model },
              body: res
            })
          }
          );
      };
      //   fetch("https://catfact.ninja/fact", {
      //     headers: {
      //       Accept: "application/json",
      //     },
      //   })
      //     .then((res) => res.text())
      //     .then((res) =>
      //       reply({
      //         status: "success",
      //         metadata: {},
      //         body: new TextEncoder().encode(res),
      //       })
      //     );
      // };
    },
  };


  const apiToken =
    'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzMxNjczMjY3LCJzdWIiOiIwZjEzYzA0ZS0zOTliLTQ1ZDctOTc0MS01MmViN2IwNDA0YmN-U1RBR0lOR34yZTMzMGJmMy0yYTVkLTQzMDYtYTcxNi04MjkwYzQwMTA5YzgifQ.cilU2oQ4FTIa07M7Hlk5zcpMw3fHcBSen9V7BKLQuZ4'
  const cameraKit = await bootstrapCameraKit({ apiToken }, (container) =>
    container.provides(
      Injectable(
        remoteApiServicesFactory.token,
        [remoteApiServicesFactory.token],
        (existing) => [...existing, catFactsService]
      )
    )
  );

  const canvas = document.getElementById('my-canvas');
  const session = await cameraKit.createSession({ liveRenderTarget: canvas });
  session.events.addEventListener('error', (event) => {
    if (event.detail.error.name === 'LensExecutionError') {
      console.log(
        'The current Lens encountered an error and was removed.',
        event.detail.error
      );
    }
  });

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });

  const source = createMediaStreamSource(stream, {
    transform: Transform2D.MirrorX,
    cameraType: 'front',
  });
  // const source = createVideoSource(document.getElementById("test-video"))
  await session.setSource(source);

  const lens = await cameraKit.lensRepository.loadLens(
    // '3d9d5846-c0ef-4787-b338-b35610c865c1',
    // '0aa8684e-4bac-4e4a-8464-73a3cd471c20',lens 1
    '2f4d27a9-9308-4200-bd07-83b86aed36ba',
    '25e437dd-fe82-498a-a631-4f9b52194eb4'
  );
  // const lens = await cameraKit.lensRepository.loadLensGroups
  await session.applyLens(lens, {
    // launchParams: {
    //   outfitIndex: "" + (document.URL.split("=")[1] ?? "0"),
    // },
  });

  await session.play();
  console.log('Lens rendering has started!');
}



