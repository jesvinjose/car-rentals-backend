const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const adminAuth=require('../middlewares/verifyAdminToken')
const multer = require('multer')
const path = require('path')

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/avif': 'avif',
  'image/webp': 'webp'
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    if (!isValid) {
      const uploadError = new Error('Invalid image type');
      return cb(uploadError);
    }
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + '_' + file.originalname;
    cb(null, fileName)
  }
})


const store = multer({ storage: storage, limits: { fileSize: 1024 * 1024 } });

// Define a route for the admin login page when accessed with /admin
router.post('/login', adminController.adminLogin);
router.post('/home',adminController.loadAdminHome)

router.get('/userslist',adminAuth.verifyAdminToken,adminController.getUsersList)

router.put('/userblock/:id',adminAuth.verifyAdminToken,adminController.blockUser)
router.put('/userunblock/:id',adminAuth.verifyAdminToken,adminController.unblockUser)
router.get('/vendorslist',adminAuth.verifyAdminToken,adminController.getVendorsList)
router.put('/vendorblock/:id',adminAuth.verifyAdminToken,adminController.blockVendor)
router.put('/vendorunblock/:id',adminAuth.verifyAdminToken,adminController.unblockVendor)

// router.put('/userVerificationAccept/:id',adminController.acceptUser)
// router.put('/userVerificationReject/:id',adminController.rejectUser)
// router.put('/vendorVerificationAccept/:id',adminController.acceptVendor)
// router.put('/vendorVerificationReject/:id',adminController.rejectVendor)
// router.post('/carTypeRegister',adminController.registerCarType)
// router.get('/cartypeslist',adminController.getCartypeslist)
// router.put('/carTypeblock/:id',adminController.blockCarType)
// router.put('/carTypeunblock/:id',adminController.unblockCarType)
// router.put('/carTypeEdit/:id',adminController.editCarType)

router.get('/carslist',adminAuth.verifyAdminToken,adminController.getCarsList);
router.put('/carblock/:id',adminAuth.verifyAdminToken,adminController.blockCar)
router.put('/carunblock/:id',adminAuth.verifyAdminToken,adminController.unblockCar);

router.put('/carrVerificationAccept/:id',adminAuth.verifyAdminToken,adminController.acceptCar)
router.put('/carrVerificationReject/:id',adminAuth.verifyAdminToken,adminController.rejectCar)
router.get('/findVendorNameAndAdhar/:id',adminAuth.verifyAdminToken,adminController.getVendorNameAndAdharImages);

router.post('/addCarousels',adminAuth.verifyAdminToken,store.array('carouselImages', 4),adminController.addCarousel)
router.get('/carouselslist',adminAuth.verifyAdminToken,adminController.getCarouselList)
router.delete('/delete-carousel/:carouselId',adminAuth.verifyAdminToken,adminController.deleteCarousel)
router.put('/editCarousel/:carouselId',adminAuth.verifyAdminToken,store.array('carouselImages', 4),adminController.editCarousel)
router.get('/loadEditCarousel/:carouselId',adminAuth.verifyAdminToken,adminController.loadEditCarousel)
router.put('/carouselblock/:id',adminAuth.verifyAdminToken,adminController.blockCarousel)
router.put('/carouselunblock/:id',adminAuth.verifyAdminToken,adminController.unblockCarousel)

module.exports = router;
