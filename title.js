import { exec } from "child_process";
import path from "path";
import { LMStudioClient } from "@lmstudio/sdk";
import fs from "fs"
import { promisify } from "util";

//creates a way to wait for a shell command in order to keep going
const execAsync = promisify(exec);

//Global Variables
const pdfsFoldersPath_list = [];
const oldFilesPath_list = [];
const newFilesPath_list = [];
//Converts Pdfs to pngs
async function pdfToPng() {
    const folderPath = '/Users/benjaminpease/Documents/Consume';
    const files = fs.readdirSync(folderPath);
    let i = 0;
    for (const file of files) {
        if (file != '.DS_Store') {
            const fullPath = path.join(folderPath, file);
            const pdfFolder = `/Users/benjaminpease/Documents/Output/PDF${i}`;
            oldFilesPath_list.push(fullPath);
            newFilesPath_list.push(pdfFolder);
            fs.mkdirSync(pdfFolder);
            const cmd = `/opt/homebrew/bin/pdftoppm -png -r 300 "${oldFilesPath_list[i]}" ${newFilesPath_list[i]}/pdfPNG${i}`;
            // ↓↓↓ wait for this shell command to finish before continuing
            await execAsync(cmd);
            console.log(`Saved ${file} as Images`);
            i++;
        }
    }
}

async function pdfRenamer() {
    const client = new LMStudioClient();
    const model = await client.llm.model("qwen/qwen2.5-vl-7b");
    const responses_list = [];
    for (let i=0; i < newFilesPath_list.length; i++){
        const images = fs.readdirSync(newFilesPath_list[i]);
        const images_list = [];
        for (const image of images){
            const fullImagePath = path.join(newFilesPath_list[i],image);
            const loadedImage = await client.files.prepareImage(fullImagePath);
            images_list.push(loadedImage);
        }
        const model = await client.llm.model("qwen/qwen2.5-vl-7b");
        const result = await model.respond([
            { role: "user", content: `These are notes from my classes MATH 295, PHYSICS 160, ASIANLAN 407, and CLCIV 101, please look at the document and return just what you see as the title at the top of the document. Note: that the title should contain one of the classes that I listed earlier. Further note: if no class title is given then you can make up a title based on the content`, images: images_list },
        ]);
        responses_list.push(result.content)
        console.log(oldFilesPath_list[i]);
        console.log(newFilesPath_list[i]);
        console.log(responses_list[i]);
    }     
    const oldFolderPath = '/Users/benjaminpease/Documents/Consume';
    const oldFiles = fs.readdirSync(oldFolderPath);
    let k = 0;
    for (const oldFile of oldFiles) {
        if (oldFile === '.DS_Store') continue;
        const oldFullPath = path.join(oldFolderPath, oldFile);
        const newFullPath = `/Users/benjaminpease/Documents/Output/${responses_list[k]}.pdf`
        fs.rename(oldFullPath, newFullPath, function (err) {
            if (err) {
                throw err
            } else {
                 console.log('Successfully renamed - AKA moved!')
            }
        })
        const remove = `rm -rf /Users/benjaminpease/Documents/Output/PDF${k}`
        exec(remove);
        k++;
    }
}

await pdfToPng();
await pdfRenamer();