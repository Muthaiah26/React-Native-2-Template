import AsyncStorage from "@react-native-async-storage/async-storage";


async function getEndpoint(type) {
  if(type === 'helper') {
    return `${process.env.REACT_APP_HELPER_BACKEND}`;
  }
  const snoString = await AsyncStorage.getItem('sno');
  const token= await AsyncStorage.getItem('test');
  const qid = parseInt(snoString, 10);
  console.log(qid,(qid<= 1500),(1500< qid && qid <= 3100),(3100< qid && qid <= 4700));
  if(qid<= 1500) {
    return `${process.env.REACT_APP_BACKEND_ENDPOINT1}`; //expected req 90k
  } else if(1500< qid && qid <= 3100) {
       return `${process.env.REACT_APP_BACKEND_ENDPOINT2}`;                         // expected req 94k
  }
  else if(3100< qid && qid <= 4700) {
    return `${process.env.REACT_APP_BACKEND_ENDPOINT3}`; // expected 94k
  }
  else{
       return `${process.env.REACT_APP_BACKEND_ENDPOINT1}`;                           //82k
  }
}

export default getEndpoint;