import "@testing-library/jest-dom";
import util from "util";
import crypto from "crypto";

jest.mock("react-ga");

// XXX jsdom does not support the web animations api
const animateMock = () => {
  return { onfinish: () => {} };
};

if (!window.HTMLDivElement.prototype.animate) {
  window.HTMLDivElement.prototype.animate = animateMock;
} else {
  console.error(
    "JSDOM appears to support the web animations api",
    "you may now remove the mock"
  );
}

// Provide node modules that are required by bakeryjs.
global.TextDecoder = util.TextDecoder;
global.TextEncoder = util.TextEncoder;
global.crypto = crypto;
