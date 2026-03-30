const db = require('../config/db');

/**
 * @desc Get Dashboard Data
 * @route GET /api/dashboard/items
 * @access Private
 */

exports.getDashbaordItems = async (req, res) => {
    try{
        console.log(req.user)
        const userId = req.user.id;
        const [items] = await db.query(
            'SELECT * FROM dashboard_items WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json({
            success: true,
            count:items.length,
            data: items
        });
    }catch(error){
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

/**
 * @desc Get Dashboard Stats
 * @route GET /api/dashboard/stats
 * @access Private
 */

exports.getDashboardStats = async (req, res) => {
    try{
        const userId = req.user.id;
        const [totalResult]= await db.query(
            'SELECT COUNT(*) AS total FROM dashboard_items WHERE user_id = ?',
            [userId]
        );
        const [activeResult] = await db.query(
            'SELECT COUNT(*) AS active FROM dashboard_items WHERE user_id = ? AND status = "active"',
            [userId]
        );
        const [completedResult] = await db.query(
            'SELECT COUNT(*) AS completed FROM dashboard_items WHERE user_id = ? AND status = "completed"',
            [userId]
        );
        const [pendingResult] = await db.query(
            'SELECT COUNT(*) AS pending FROM dashboard_items WHERE user_id = ? AND status = "pending"',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                total: totalResult[0].total,
                active: activeResult[0].active,
                completed: completedResult[0].completed,
                pending: pendingResult[0].pending
            }
        });
    }catch(error){
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

/**
 * @desc Create new Dashboard item
 * @route POST /api/dashboard/items
 * @access Private
 */
exports.createDashboardItem = async (req, res) => {
    try{
        const userId = req.user.id;
        const { title, description, status } = req.body;

        if(!title){
            return res.status(400).json({
                success: false,
                message: 'Please provide title'
            });
        }

         const [result] = await db.query(
            'INSERT INTO dashboard_items (user_id, title, description, status) VALUES (?, ?, ?, ?)',
            [userId, title, description, status || 'active']
        );

        const [newItem ] = await db.query(
            'SELECT * FROM dashboard_items WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Dashboard Item Created Successfully',
            data: newItem[0]
        })

    }catch(error){
        console.error('Error creating dashboard item:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

/**
 * @desc Update Dashboard Item
 * @route PUT /api/dashboard/items/:id
 * @access Private
 */

exports.updateDashboardItem = async (req, res) => {
    try{
        const userId = req.user.id;
        const itemId = req.params.id;
        const { title, description, status } = req.body;
        const [items] = await db.query(
            'SELECT * FROM dashboard_items WHERE id = ? AND user_id = ?',
            [itemId, userId]
        );

        if(items.length === 0){
            return res.status(404).json({
                success: false,
                message: 'Dashboard Item Not Found'
            });
        }

        await db.query(
            'UPDATE dashboard_items SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?',
            [title, description, status, itemId, userId]
        );

        const [updatedItem] = await db.query(
            'SELECT * FROM dashboard_items WHERE id = ? AND user_id = ?',
            [itemId, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Dashboard Item Updated Successfully',
            data: updatedItem[0]
        });

    }catch(error){
        console.error('Error updating dashboard item:', error);``
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

/**
 * @desc Delete Dashboard Item
 * @route DELETE /api/dashboard/items/:id
 * @access Private
 */
exports.deleteDashboardItem = async (req, res) => {
    try{
        const userId = req.user.id;
        const itemId = req.params.id;
        const [items] = await db.query(
            'SELECT * FROM dashboard_items WHERE id = ? AND user_id = ?',
            [itemId, userId]
        );
        if(items.length === 0){
            return res.status(404).json({
                success: false,
                message: 'Dashboard Item Not Found'
            });
        }
        await db.query('DELETE FROM dashboard_items WHERE id = ? AND user_id = ?', [itemId, userId]);
        res.status(200).json({
            success: true,
            message: 'Dashboard Item Deleted Successfully'
        });
    }catch(error){
        console.error('Error deleting dashboard item:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}