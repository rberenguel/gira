import { set, get } from "../libs/idb-keyval.js";

const slopeColor = "#c60";
const verticalLinesColor = "#666";
const currentPositionColor = "#06c";
let resistance = 0;
let startTime;
let elapsedTime = 0;
let duration = 30 * 60 * 1000; // 30 minutes in milliseconds
let slopePoints = [];
let currentPositionX = 0;

let graphHeight = 120;
let timeSpeedFactor = 10; // For debugging the graph
let elevationGainPerResistanceLevel = 8;
let started = false;

const currentResistanceDiv = document.getElementById("current-resistance-text");

let p5Sketch = function (p) {
  p.setup = function () {
    let canvas = p.createCanvas(
      document.getElementById("sketch-holder").offsetWidth,
      document.getElementById("sketch-holder").offsetHeight,
    );
    canvas.parent("sketch-holder");
    p.frameRate(30);
    startTime = p.millis();
    generateWorkoutRoute(); // Pre-generate the route in setup
  };

  p.draw = function () {
    if (!started) {
      return;
    }
    elapsedTime = (p.millis() - startTime) * timeSpeedFactor;

    if (elapsedTime >= duration) {
      p.noLoop(); // Stop after 30 minutes
      resistance = "Workout Complete!";
    } else {
      updateCurrentResistance();
    }
    p.clear();

    currentResistanceDiv.textContent = "Resistance: " + resistance;

    let nextResistance = "N/A";
    let timeLeftSeconds = 0;
    if (elapsedTime < duration) {
      for (let i = 0; i < slopePoints.length - 1; i++) {
        if (
          slopePoints[i].time <= elapsedTime &&
          slopePoints[i + 1].time > elapsedTime
        ) {
          nextResistance = slopePoints[i + 1].res;
          timeLeftSeconds = Math.round(
            (slopePoints[i + 1].time - elapsedTime) / 1000,
          );
          break;
        }
      }
    }
    let nextResistanceText = "Next Resistance: " + nextResistance;
    if (timeLeftSeconds > 0) {
      nextResistanceText += " in " + timeLeftSeconds + "s";
    } else if (elapsedTime < duration) {
      nextResistanceText += " (Soon)";
    } else {
      nextResistanceText = "";
    }
    document.getElementById("next-resistance-text").textContent =
      nextResistanceText;

    drawSlopeGraph(p);
    drawCurrentPosition(p);
  };

  function generateWorkoutRoute() {
    slopePoints = [];
    let currentTime = 0;
    let currentResistance = Math.round(p.noise(p.random(1000)) * 10);
    slopePoints.push({ time: 0, res: currentResistance });

    while (currentTime < duration) {
      let changeInterval = p.random(2 * 60 * 1000, 3 * 60 * 1000); // 2 to 3 minutes
      currentTime += changeInterval;
      if (currentTime > duration) {
        currentTime = duration; // Cap the last interval to duration
      }

      // Introduce more variation:
      if (p.random() < 0.3) {
        // 30% chance of flat (resistance 0)
        currentResistance = 0;
      } else if (p.random() < 0.15) {
        // 15% chance of downhill (negative inclination - simulated by lower positive resistance)
        currentResistance = Math.max(
          0,
          Math.round(p.noise(currentTime / 10000 + p.random(1000)) * 5) - 3,
        ); // Resistance 0 to 2 (biased low)
      } else {
        // Otherwise, standard noise-based resistance (uphill/flatter)
        currentResistance = Math.round(
          p.noise(currentTime / 10000 + p.random(1000)) * 10,
        );
      }

      slopePoints.push({ time: currentTime, res: currentResistance });
    }
  }
  function updateCurrentResistance() {
    if (slopePoints.length === 0) return;

    for (let i = slopePoints.length - 1; i >= 0; i--) {
      if (slopePoints[i].time <= elapsedTime) {
        resistance = slopePoints[i].res;
        break;
      }
    }
    if (elapsedTime >= duration) {
      resistance = "Workout Complete!";
    }
  }

  function drawSlopeGraph(p) {
    p.push();
    p.translate(0, p.height - 0);
    let graphWidth = p.width;

    let timeScale = graphWidth / duration;

    p.stroke(verticalLinesColor);
    p.strokeWeight(2);
    for (let i = 1; i < slopePoints.length; i++) {
      let x = p.round(slopePoints[i].time * timeScale);
      p.line(x, 0, x, -graphHeight);
    }

    p.noFill();
    p.stroke(slopeColor);
    p.strokeWeight(2);
    p.beginShape();
    let cumulativeElevation = 0;
    p.vertex(0, 0);

    for (let i = 0; i < slopePoints.length - 1; i++) {
      let x1 = slopePoints[i].time * timeScale;
      let x2 = slopePoints[i + 1].time * timeScale;
      let res1 = slopePoints[i].res;

      let segmentWidth = x2 - x1;

      let elevationChange =
        (res1 / 100) * segmentWidth * elevationGainPerResistanceLevel;
      cumulativeElevation -= elevationChange;

      p.vertex(x2, cumulativeElevation);
    }
    p.endShape();
    p.pop();
  }

  function drawCurrentPosition(p) {
    if (slopePoints.length < 2 || elapsedTime >= duration) return;

    p.push();
    p.translate(0, p.height - 0);
    let graphWidth = p.width;
    let timeScale = graphWidth / duration;
    currentPositionX = elapsedTime * timeScale;
    let currentElevationY = 0;
    let cumulativeElevationForPosition = 0;

    for (let i = 0; i < slopePoints.length - 1; i++) {
      let x1 = slopePoints[i].time * timeScale;
      let x2 = slopePoints[i + 1].time * timeScale;

      if (currentPositionX >= x1 && currentPositionX <= x2) {
        let res1 = slopePoints[i].res;
        let segmentWidth = x2 - x1;
        let elevationChange =
          (res1 / 100) * segmentWidth * elevationGainPerResistanceLevel;

        let normalizedPositionInSegment =
          (currentPositionX - x1) / segmentWidth;
        currentElevationY =
          cumulativeElevationForPosition -
          elevationChange * normalizedPositionInSegment;
        break;
      } else {
        let segmentWidth = x2 - x1;
        let elevationChange =
          (slopePoints[i].res / 100) *
          segmentWidth *
          elevationGainPerResistanceLevel;
        cumulativeElevationForPosition -= elevationChange;
      }
    }
    p.noStroke();
    p.fill(currentPositionColor);
    p.ellipse(currentPositionX, currentElevationY, 10, 10);
    p.pop();
  }
};

new p5(p5Sketch);

let container = document.querySelector(".draggable-container");
let startScale = 1;
let currentScaleFactor = 1;
let dragDataX = 0;
let dragDataY = 0;
const WHEEL_SCALE_FACTOR = 1.05;

interact(".draggable-container")
  .draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: "parent",
        endOnly: true,
      }),
    ],
    autoScroll: true,
    onmove: dragMoveListener,
    onend: function (event) {},
    ignoreFrom: "#metap-trigger",
  })
  .gesturable({
    ignoreFrom: "#metap-trigger",
    listeners: {
      start(event) {
        startScale = currentScaleFactor;
      },
      move(event) {
        currentScaleFactor = startScale * event.scale;

        event.target.style.transform =
          "translate(" +
          dragDataX +
          "px, " +
          dragDataY +
          "px) scale(" +
          currentScaleFactor +
          ")";
      },
      end(event) {},
    },
  });

function dragMoveListener(event) {
  var target = event.target;
  dragDataX += event.dx;
  dragDataY += event.dy;

  target.style.transform =
    "translate(" +
    dragDataX +
    "px, " +
    dragDataY +
    "px) scale(" +
    currentScaleFactor +
    ")";

  target.setAttribute("data-x", dragDataX);
  target.setAttribute("data-y", dragDataY);
}

window.dragMoveListener = dragMoveListener;

document.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey) {
      event.stopPropagation();
      event.preventDefault();
      if (event.deltaY > 0) {
        currentScaleFactor /= WHEEL_SCALE_FACTOR;
      }
      if (event.deltaY < 0) {
        currentScaleFactor *= WHEEL_SCALE_FACTOR;
      }

      container.style.transform =
        "translate(" +
        dragDataX +
        "px, " +
        dragDataY +
        "px) scale(" +
        currentScaleFactor +
        ")";
    }
  },
  {
    passive: false,
  },
);

let playlistUrl = await get("playlistUrl");
console.info(`Stored URL: ${playlistUrl}`);

// If no video has been ever provided I add a potential placeholder one.
if (!playlistUrl.trim()) {
  playlistUrl = "https://www.youtube.com/embed/vtIzMaLkCaM?si=8yYT3QU43wvBkJNI";
}

const iframe = document.querySelector("IFRAME");
iframe.src = playlistUrl;

const commands = [
  {
    title: "Start!",
    lambda: () => {
      started = true;
    },
  },
  {
    title: "Change embed URL",
    inputs: [{ title: "Full URL" }],
    lambda: async (url) => {
      await set("playlistUrl", url);
      console.info(`URL for embed set as ${url}`);
    },
  },
  {
    title: "Stop!",
    lambda: () => {
      started = false;
    },
  },
];

metaP.bind(commands, { sepia: 30 });

const metaPTrigger = document.getElementById("metap-trigger");

metaPTrigger.addEventListener("click", (ev) => {
  metaP.metaP();
});

currentResistanceDiv.textContent =
  "Press the menu to the left and choose start when ready";
