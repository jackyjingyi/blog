/**
 * 弹窗选择
 * Created by wrb on 2019/11/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_select_field_by_check",
        defaults = {
            title:null,
            isDialog:true,
            dataList:null,//数据
            selectedItems:null,
            okCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._selectedItemList = [];//选择列表

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_common/m_select_field_by_check',{
                dataList: that.settings.dataList
            });
            that.renderDialog(html,function () {

                that.initICheck();

                if(that.settings.selectedItems){
                    $.each(that.settings.selectedItems,function (i,item) {

                        var $item = $(that.element).find('input[type="checkbox"][value="'+item.fieldName+'"]');
                        that._selectedItemList.push({
                            fieldName:item.fieldName,
                            id:$item.attr('data-id'),
                            relationId:$item.attr('data-relation-id')
                        });
                    });
                    that.renderSelectedItemList();
                    //已选匹配checkbox选中
                    $(that.element).find('#selectItemBox .field-name').each(function () {
                        var fieldName = $(this).attr('data-field-name');
                        $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').prop('checked',true);
                        $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('update');
                    });
                    that.checkItemAll(1);
                }

            });
        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'选择',
                    area : '900px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var dataList = [];
                        $(that.element).find('#selectItemBox .item-span .field-name').each(function (i) {

                            var dataId = $(this).attr('data-id');
                            var fieldName = $(this).attr('data-field-name');
                            var relationId = $(this).attr('data-relation-id');
                            dataList.push({
                                fieldName:fieldName,
                                id:dataId,
                                relationId:relationId
                            });
                        });
                        if(that.settings.okCallBack)
                            that.settings.okCallBack(dataList);
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //绑定checkbox显示
        ,initICheck:function($ele){
            var that = this;
            if($ele==null)
                $ele = $(that.element);

            $ele.find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });

            $ele.find('input[name="itemCk"]').on('ifChecked', function(e){

                var fieldName = $(this).val();
                var itemId = $(this).attr('data-id');
                var relationId = $(this).attr('data-relation-id');
                //没有选择，才处理
                if($(that.element).find('#selectItemBox .list-group-item .field-name[data-field-name="'+fieldName+'"]').length==0){
                    that._selectedItemList.push({
                        fieldName:fieldName,
                        id:itemId,
                        relationId:relationId
                    });
                    that.renderSelectedItemList();
                }
                that.checkItemAll();
                return false;

            }).on('ifUnchecked', function(e){

                var fieldName = $(this).val();
                //有选择，才处理
                if($(that.element).find('#selectItemBox .list-group-item .field-name[data-field-name="'+fieldName+'"]').length>0){
                    delObjectInArray(that._selectedItemList,function (obj) {
                        return obj.fieldName == fieldName;
                    });
                    that.renderSelectedItemList();
                }
                that.checkItemAll();
                return false;
            });

            $ele.find('input[name="allItemCK"]').on('ifChecked', function(e){


                $(that.element).find('input[name="itemCk"]').iCheck('check');
                return false;

            }).on('ifUnchecked', function(e){

                $(that.element).find('input[name="itemCk"]').iCheck('uncheck');

                return false;
            });

        }
        //全选判断
        ,checkItemAll:function (type) {
            var that = this;
            var itemLen = $(that.element).find('input[name="itemCk"]').length;
            var itemCheckLen = $(that.element).find('input[name="itemCk"]:checked').length;
            if(itemLen==itemCheckLen){
                $(that.element).find('input[name="allItemCK"]').prop('checked',true);
                $(that.element).find('input[name="allItemCK"]').iCheck('update');
            }else{
                $(that.element).find('input[name="allItemCK"]').prop('checked',false);
                $(that.element).find('input[name="allItemCK"]').iCheck('update');
            }
        }
        ,renderSelectedItemList:function () {
            var that = this;
            var iHtml = '';
            if(that._selectedItemList && that._selectedItemList.length>0){
                $.each(that._selectedItemList,function (i,item) {
                    iHtml+='<div class="col-sm-6 p-r-none m-b list-group-item" data-sortId="'+i+'">';
                    iHtml+='<span class="item-span m-r-xs bg-muted p-xxs f-s-xs" >';
                    iHtml+='<span class="field-name text-ellipsis" data-toggle="tooltip" data-container="body" data-original-title="'+item.fieldName+'"';
                    iHtml+='data-field-name="'+item.fieldName+'" data-id="'+item.id+'" data-relation-id="'+item.relationId+'">';
                    iHtml+=item.fieldName;
                    iHtml+='</span>';
                    iHtml+='<a class="curp" href="javascript:void(0)" data-action="delSelectedItem">';
                    iHtml+='<i class="fa fa-times fc-red"></i></a>';
                    iHtml+='</span>';
                    iHtml+='</div>';
                });
            }

            $(that.element).find('#selectItemBox').html(iHtml);
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

            //删除已选
            $(that.element).find('#selectItemBox').find('a[data-action="delSelectedItem"]').on('click',function () {
                var fieldName = $(this).prev('.field-name').attr('data-field-name');

                var $item = $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]');

                if($item.length>0 && $item.is(':checked')){
                    $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('uncheck');
                }else{

                    delObjectInArray(that._selectedItemList,function (obj) {
                        return obj.fieldName == fieldName;
                    });
                    $(this).closest('.list-group-item').remove();
                }
            });
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);


