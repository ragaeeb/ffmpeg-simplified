import ffmpeg from "fluent-ffmpeg";
import path from "node:path";

export const adjustAudioSync = (
  inputFile: string,
  outputFile: string,
  delayInSeconds: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputFile)
      .outputOptions(`-itsoffset ${-delayInSeconds}`)
      .complexFilter("[1:a]adelay=0[aud]")
      .map("[aud]")
      .map("0:v")
      .videoCodec("copy")
      .audioCodec("copy")
      .save(outputFile)
      .on("end", () => resolve(outputFile))
      .on("error", (err: any) => reject(err));
  });
};
