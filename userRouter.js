const express = require('express');
const router = express.Router();
const User = require('./userSchema'); // Import your user model
const jwt = require("jsonwebtoken")


router.post('/createUser', async (req, res) => {
  try {
    // Create a new user instance with the provided data
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });

    

   
    // Save the user to the database
    await newUser.save();
// Generate a JWT token
const token = jwt.sign({ _id: newUser._id }, process.env.SECRETE_KEY,  { expiresIn: '1d' });
 // Assign the token to the user
 newUser.token = token;

    // Create the response object
    const response = {
      status_code: '200',
      message: 'User created successfully',
      data: {
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        latitude: newUser.latitude,
        longitude: newUser.longitude,
        status: newUser.status,
        register_at: newUser.register_at,
        token: newUser.token,
      },
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update status
router.put('/changeStatus', async (req, res) => {
  try {
    // Extract the token from the request header
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        status_code: '401',
        message: 'Token is missing. Please provide a valid token in the header.',
      });
    }

    // Verify the token and decode the user's email
    
    const decoded = jwt.verify(token, process.env.SECRETE_KEY);
   // console.log("email",decoded)
    if (!decoded._id) {
      return res.status(401).json({
        status_code: '401',
        message: 'Invalid token. Please provide a valid token in the header.',
      });
    }

    const userId = decoded._id;

    // Update the user's status in the database
    const result = await User.updateOne({ _id:userId }, { status: 'offline' });

    if (!result) {
      return res.status(404).json({
        status_code: '404',
        message: 'User not found or status already updated.',
      });
    }

    res.json({
      status_code: '200',
      message: 'User status updated successfully.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//get distance 

// Secret key for JWT (should match the one used for token creation)

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    console.log(lat1, lon1,lat2, lon2, )
  const R = 6371; // Radius of the Earth in kilometers
  const lat1Rad = (Math.PI * lat1) / 180;
  const lat2Rad = (Math.PI * lat2) / 180;
  const dLat = lat2Rad - lat1Rad;
  const dLon = ((Math.PI * lon2) / 180) - ((Math.PI * lon1) / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(2) + 'km';
}

router.get('/getDistance', async (req, res) => {
  try {
    // Extract the user's token from the request header
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        status_code: '401',
        message: 'Token is missing. Please provide a valid token in the header.',
      });
    }

    // Verify the token and decode the user's current location (latitude and longitude)
    const decoded = jwt.verify(token, process.env.SECRETE_KEY);

      
   const res1 = await User.findById({_id:decoded._id})
      console.log(res1)
    const userLatitude = res1.latitude;
    const userLongitude = res1.longitude;

     // Get the destination latitude and longitude from the query parameters
     const destinationLatitude = parseFloat(req.query.destinationLatitude);
     const destinationLongitude = parseFloat(req.query.destinationLongitude);
 
     if (isNaN(destinationLatitude) || isNaN(destinationLongitude)) {
       return res.status(400).json({
         status_code: '400',
         message: 'Invalid destination coordinates. Please provide valid latitude and longitude.',
       });
     }
 
     // Calculate the distance between the user's current location and the destination
     const distance = calculateDistance(userLatitude, userLongitude, destinationLatitude, destinationLongitude);
 
     res.json({
       status_code: '200',
       message: 'Distance calculated successfully',
       distance: distance,
     });
   } catch (err) {
     res.status(500).json({ status_code: '500', message: 'Error: ' + err.message });
   }
 });



//  day and week 
// day and week 
router.get('/user_list', async (req, res) => {
  const { weekNo, dayOfWeek } = req.query;

  // Calculate the date range for the specified week and day
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setUTCDate(startDate.getUTCDate() - (currentDate.getUTCDay() + 7 - dayOfWeek) % 7 + weekNo * 7);
  startDate.setUTCHours(0, 0, 0, 0);

 console.log(startDate);
 const endDate = new Date(startDate);
 endDate.setUTCDate(endDate.getUTCDate() + 7);
 endDate.setUTCHours(23, 59, 59, 999);
 console.log(endDate);
  try {
  
    // Query the database to find records within the specified date range
    const data = await User.find({ register_at: { $gte: startDate, $lte: endDate } });
console.log(data);
    // Initialize an object to store data by day
    const dayData = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    // Group data by day
    data.forEach((record) => {
      const dayOfWeek = record.register_at.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
      const dayName = getDayName(dayOfWeek);
      dayData[dayName].push({
        name: record.name,
        email: record.email,
      });
    });

    res.json(dayData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Helper function to get the day name
function getDayName(dayOfWeek) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayOfWeek];
}


module.exports = router;
