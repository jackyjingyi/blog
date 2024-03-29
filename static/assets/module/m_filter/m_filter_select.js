/**
 * select下拉筛选
 * Created by wrb on 2018/8/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_filter_select",
        defaults = {
            eleId:null,//元素ID
            align:null,//浮窗位置
            isMultiple:false,//是否多选，是，开放checkbox
            isSelectAll:true,//是否全部
            outClass:null,//select样式类名
            popoverClass:null,
            placement:null,
            selectArr:null,//筛选的数据(list对象,selectArr:[{id: "XX1", name: "XX2"}]
            selectedArr:null,//当前选中项（checkbox时多个,[id1,id2]）
            selectedCallBack:null//选择回调
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._selectedArr = this.settings.selectedArr;
        this._selectedStr = '';


        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function () {
            var that = this;

            if(that.settings.selectedArr!=null && that.settings.selectedArr.length>0){
                $(that.element).find('i').addClass('fc-v1-blue');
            }

            $(that.element).on('click',function (e) {

                var selectList = that.reSetSelectedList();
                var iHtml = template('m_filter/m_filter_select',{
                    selectList:selectList,
                    isMultiple:that.settings.isMultiple,
                    outClass:that.settings.outClass
                });

                $(that.element).m_floating_popover({
                    eleId:that.settings.eleId,
                    content:iHtml,
                    placement:that.settings.placement || 'bottomRight',
                    popoverClass:that.settings.popoverClass,
                    renderedCallBack:function ($popover) {

                        if(that.settings.isMultiple)
                            that.initICheck($popover);

                        $popover.find('.dropdown-menu a').on('click',function () {
                            var val = $(this).attr('data-state-no');
                            that._selectedArr = [];
                            if(val!='')
                                that._selectedArr.push(val);

                            if(that._selectedArr!=null && that._selectedArr.length>0){
                                $(that.element).find('i').addClass('fc-v1-blue');
                            }else{
                                $(that.element).find('i').removeClass('fc-v1-blue');
                            }
                            if(that.settings.selectedCallBack)
                                that.settings.selectedCallBack(that._selectedArr);

                            $(that.element).m_floating_popover('closePopover');//关闭浮窗
                        });
                    }

                },true);

                e.stopPropagation();
                return false;
            });
        }
        //过滤list,标上选中标识
        ,reSetSelectedList:function () {
            var that =this;
            var selectList = [];
            if(that._selectedArr!=null && that._selectedArr.length>0){
                that._selectedStr = that._selectedArr.join(',');　　//转为字符串
                that._selectedStr = ','+that._selectedStr+','
            }else{
                that._selectedStr = '';
            }
            if(that.settings.isSelectAll)
                selectList.push({name:'全部',id:''});

            /*if(that.settings.selectArr!=null && Object.getOwnPropertyNames(that.settings.selectArr).length>0){
                $.each(that.settings.selectArr, function (key, value) {
                    var isSelected = false;
                    if(that._selectedStr.indexOf(key)>-1){
                        isSelected = true;
                    }
                    selectList.push({fieldValue: key, fieldName: value,isSelected:isSelected});
                });
            }*/

            if(that.settings.selectArr!=null && that.settings.selectArr.length>0){
                $.each(that.settings.selectArr, function (i, item) {
                    var isSelected = false;
                    if(item==null)
                        return true;

                    if(that._selectedStr.indexOf(','+item.id+',')>-1){
                        isSelected = true;
                    }
                    selectList.push({id: item.id, name: item.name,isSelected:isSelected});
                });
            }
            return selectList;
        }
        //初始化iCheck
        ,initICheck:function ($ele) {
            var that = this;
            var ifChecked = function (e) {
                var id = $(this).val();
                if(id==''){//选择的是全部-全选
                    $ele.find('input[name="itemCk"]').prop('checked',true);
                    $ele.find('input[name="itemCk"]').iCheck('update');
                }
                that.dealAllCheck($ele);
                that.getSelectedData($ele);
            };
            var ifUnchecked = function (e) {
                var id = $(this).val();
                if(id==''){//选择的是全部-全选
                    $ele.find('input[name="itemCk"]').prop('checked',false);
                    $ele.find('input[name="itemCk"]').iCheck('update');
                }
                that.dealAllCheck($ele);
                that.getSelectedData($ele);
            };
            $ele.find('input[name="itemCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //判断是否全选
        ,dealAllCheck:function ($ele) {
            var that = this;
            var allLen = $ele.find('input[name="itemCk"][value!=""]').length;
            var allCkLen = $ele.find('input[name="itemCk"][value!=""]:checked').length;

            if(allCkLen==allLen){
                $ele.find('input[name="itemCk"][value=""]').prop('checked',true);
                $ele.find('input[name="itemCk"][value=""]').iCheck('update');
            }else{
                $ele.find('input[name="itemCk"][value=""]').prop('checked',false);
                $ele.find('input[name="itemCk"][value=""]').iCheck('update');
            }
        }
        //获取选中的数据
        ,getSelectedData :function ($ele) {
            var that = this;
            var selectedArr = [];
            $ele.find('input[name="itemCk"][value!=""]:checked').each(function () {
                selectedArr.push($(this).val());
            });
            that._selectedArr = selectedArr;
            if(that.settings.selectedCallBack)
                that.settings.selectedCallBack(selectedArr);

        }

    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
