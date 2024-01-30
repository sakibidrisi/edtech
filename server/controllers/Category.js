const Category = require('../models/Category');

//create Category handler
exports.createCategory = async (req,res) => {
    try{
        //fetch data from req body
        const {name,description} = req.body;

        //validation
        if(!name || !description){
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        //create entry in DB
        const CategorysDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log(CategorysDetails);

        //return success response
        return res.status(200).json({
            success: true,
            message: 'Categorys created successfully',
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

//Show all category handler
exports.showAllCategories = async (req,res) => {
    try{
        //find all the tags
        const allCategorys = await Category.find({}, {name:true, description:true});

        //return success response
        return res.status(200).json({
            success: true,
            message: 'All Tags returned successfully',
            data: allCategorys,
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

//CategoryPageDetails Handeler
exports.categoryPageDetails = async (req,res) => {
    try{
        //get categoryId
        const {categoryId} = req.body;

        //get courses for specified categoryId
        const selectedCategory = await Category.findById(categoryId).populate('courses').exec();

        //validation
        if(!selectedCategory){
            return res.status(404).json({
                success: false,
                message: 'Data not found',
            });
        }

        //set courses for different Categories
        const differentCategories = await Category.find({_id: {$ne: categoryId},})
                                                  .populate('courses').exec();
                            
        //get Top selling courses HW

        //return res
        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategories,
            },
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}