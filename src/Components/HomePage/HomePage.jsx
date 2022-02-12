import { useState, useEffect, useRef } from 'react';
// import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

function HomePage() {
 
    const [isModelLoading, setIsModelLoading] = useState(false)
    const [model, setModel] = useState(null)
    const [imageURL, setImageURL] = useState(null);
    const [results, setResults] = useState([])
    const [history, setHistory] = useState([])

    const imageRef = useRef()
    const textInputRef = useRef()
    const fileInputRef = useRef()

    const targetList = { 
        0 : 'aphids',
        1 : 'armyworm',
        2 : 'beetle',
        3 : 'bollworm',
        4 : 'grasshopper',
        5 : 'mites' ,
        6 : 'mosquito',
        7 : 'sawfly ',
        8 : 'stem_borer'
    }
    const loadModel = async () => {
        setIsModelLoading(true)
        try {
            // const model = await mobilenet.load()
            const model = await tf.loadLayersModel('MobileNet/model.json');
            setModel(model)
            setIsModelLoading(false)
        } catch (error) {
            console.log(error)
            setIsModelLoading(false)
        }
    }

    const preProcessing = () => {
        let tensor = tf.browser.fromPixels(imageRef.current , 3)
        .resizeNearestNeighbor([224, 224]) 
		.expandDims()
		.toFloat()
        .flatten()
        .arraySync()
        
        let tensor_processed = Object.values(tensor)
        tensor_processed = tensor_processed.map(value => ((value/127.5) - 1));
        // console.log(tensor_processed)
        return tf.tensor(tensor_processed).as4D(1,224,224,3)
    }
    
    const uploadImage = (e) => {
        const { files } = e.target
        if (files.length > 0) {
            const url = URL.createObjectURL(files[0])
            setImageURL(url)
            // preProcessing(fileData)
        } else {
            setImageURL(null)
        }
    }

    const identify = async () => {
        textInputRef.current.value = ''
        const results = await model.predict(preProcessing())
        const value = results.dataSync()
        console.log(value)
        const max = Math.max(...value)
        console.log(max)
        const indexOfMax = value.indexOf(max)
        console.log(indexOfMax)
        const pestName = targetList[indexOfMax]
        setResults([pestName , max])
    }

    const handleOnChange = (e) => {
        setImageURL(e.target.value)
        setResults([])
    }

    const triggerUpload = () => {
        fileInputRef.current.click()
    }

    useEffect(() => {
        loadModel()
    }, [])

    useEffect(() => {
        if (imageURL) {
            setHistory([imageURL, ...history])
        }
    }, [imageURL])

    if (isModelLoading) {
        return <h2>Model Loading...</h2>
    }

    return (
        <div className='homePage'>
            <h1 className='header'>Image Identification</h1>
            <div className='inputHolder'>
                <input type='file' accept='image/*' capture='camera' className='uploadInput' onChange={uploadImage} ref={fileInputRef} />
                <button className='uploadImage' onClick={triggerUpload}>Upload Image</button>
                {/* <span className='or'>OR</span> */}
                <input type="text" placeholder='Paster image URL' ref={textInputRef} onChange={handleOnChange} />
            </div>
            <div className="mainWrapper">
                <div className="imageHolder">
                    {imageURL && <img src={imageURL} alt="Upload Preview" crossOrigin="anonymous" ref={imageRef} />}
                </div>
                
                {imageURL && <button className='button' onClick={identify}>Identify Image</button>}
                {results.length > 0 && <div className='resultsHolder'>
                        <div className='result'>
                            <span className='name'>{results[0]}</span>
                            <span className='confidence'>Confidence level: {(results[1]* 100)}%</span>
                        </div>
                    </div>}
            </div>
            {history.length > 0 && <div className="recentPredictions">
                <h2>Recent Images</h2>
                <div className="recentImages">
                    {history.map((image, index) => {
                        return (
                            <div className="recentPrediction" key={`${image}${index}`}>
                                <img src={image} alt='Recent Prediction' onClick={() => setImageURL(image)} />
                            </div>
                        )
                    })}
                </div>
            </div>}
        </div>
    );
}

export default HomePage;