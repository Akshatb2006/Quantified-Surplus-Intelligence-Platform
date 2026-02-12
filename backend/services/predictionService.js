/**
 * Prediction Service
 * Spawns Python predict.py script via child_process to get demand predictions
 */

const { spawn } = require('child_process');
const path = require('path');

function predictDemand(features) {
    return new Promise((resolve, reject) => {
        const pythonPath = path.join(__dirname, '../../model/venv/bin/python3');
        const scriptPath = path.join(__dirname, '../../model/predict.py');

        const python = spawn(pythonPath, [scriptPath]);

        let dataString = '';
        let errorString = '';

        python.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${errorString}`));
                return;
            }

            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (error) {
                reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${dataString}`));
            }
        });

        // Send features as JSON to stdin
        python.stdin.write(JSON.stringify(features));
        python.stdin.end();
    });
}

module.exports = { predictDemand };
